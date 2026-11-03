import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const cleanEnv = (val?: string) => (val ? val.split('#')[0].trim() : '');

export const getBackendApiUrl = (): string => {
  const raw =
    cleanEnv(process.env.BACKEND_INTERNAL_URL) ||
    cleanEnv(process.env.API_URL) ||
    'http://127.0.0.1:8000/api/v1';

  // Prefer 127.0.0.1 over localhost in Node server-side fetch to avoid IPv6 (::1) ECONNREFUSED on Windows
  const ipv4Raw = raw.replace('://localhost:', '://127.0.0.1:');
  const trimmed = ipv4Raw.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  return `${trimmed}/api/v1`;
};

/**
 * Resilient backend fetch helper that forwards browser User-Agent & client IP
 * and falls back between 127.0.0.1 and localhost if needed.
 */
export async function fetchBackendUrl(
  endpointPath: string,
  init: RequestInit,
  req: NextRequest
): Promise<Response> {
  const baseUrl = getBackendApiUrl();
  const primaryUrl = `${baseUrl}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Forward browser User-Agent so backend directClientBlockMiddleware never flags BFF requests
  const incomingUa = req.headers.get('user-agent');
  headers.set(
    'User-Agent',
    incomingUa ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  );

  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  headers.set('X-Forwarded-For', clientIp);

  const requestInit: RequestInit = {
    ...init,
    headers,
    cache: 'no-store',
  };

  try {
    return await fetch(primaryUrl, requestInit);
  } catch (err) {
    // Fallback: if 127.0.0.1 failed, try localhost (or vice versa)
    const fallbackUrl = primaryUrl.includes('127.0.0.1')
      ? primaryUrl.replace('127.0.0.1', 'localhost')
      : primaryUrl.replace('localhost', '127.0.0.1');
    return await fetch(fallbackUrl, requestInit);
  }
}

/**
 * Verifies same-origin CSRF protection for state-changing BFF requests.
 */
export const verifyCsrfOrigin = (req: NextRequest): boolean => {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return true; // Same-origin browser fetch

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
};

async function refreshServerTokens(
  req: NextRequest,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetchBackendUrl(
      '/affiliates/refresh-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `_affiliate_r_tkn=${refreshToken}; refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      },
      req
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data?.accessToken) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Forwards an Affiliate BFF request to the internal backend `/api/v1/affiliates/...`
 * using server-side HttpOnly cookies (`_affiliate_x_tkn`) with automatic transparent token refresh.
 */
export async function forwardToAffiliateBackend(
  req: NextRequest,
  backendPath: string,
  options: {
    method?: string;
    requireAuth?: boolean;
    body?: any;
  } = {}
): Promise<NextResponse> {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { success: false, message: 'CSRF validation failed: Invalid request origin' },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get('_affiliate_x_tkn')?.value;
  const refreshToken =
    cookieStore.get('_affiliate_r_tkn')?.value || cookieStore.get('refreshToken')?.value;

  let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

  // If access token is absent but refresh token exists, auto-refresh proactively
  if (options.requireAuth && !accessToken && refreshToken) {
    refreshedTokens = await refreshServerTokens(req, refreshToken);
    if (refreshedTokens?.accessToken) {
      accessToken = refreshedTokens.accessToken;
    }
  }

  if (options.requireAuth && !accessToken) {
    return NextResponse.json(
      { success: false, code: 'UNAUTHORIZED', message: 'Authentication required' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  }

  const method = options.method || req.method;
  const searchParams = req.nextUrl.searchParams.toString();
  const endpointPath = `/affiliates${backendPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    headers['Cookie'] = `_affiliate_x_tkn=${accessToken}`;
  }

  let bodyStr: string | undefined = undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    if (options.body !== undefined) {
      bodyStr = JSON.stringify(options.body);
    } else {
      try {
        const rawBody = await req.json();
        bodyStr = JSON.stringify(rawBody);
      } catch {
        bodyStr = '{}';
      }
    }
  }

  try {
    let backendRes = await fetchBackendUrl(
      endpointPath,
      {
        method,
        headers,
        body: bodyStr,
      },
      req
    );

    // If backend returned 401 (expired access token) and we have a refresh token, auto-refresh and retry once
    if (backendRes.status === 401 && options.requireAuth && refreshToken && !refreshedTokens) {
      refreshedTokens = await refreshServerTokens(req, refreshToken);
      if (refreshedTokens?.accessToken) {
        accessToken = refreshedTokens.accessToken;
        headers['Authorization'] = `Bearer ${accessToken}`;
        headers['Cookie'] = `_affiliate_x_tkn=${accessToken}`;
        backendRes = await fetchBackendUrl(
          endpointPath,
          {
            method,
            headers,
            body: bodyStr,
          },
          req
        );
      }
    }

    const data = await backendRes.json().catch(() => ({
      success: false,
      message: 'Unexpected response from affiliate service',
    }));

    const response = NextResponse.json(data, {
      status: backendRes.status,
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });

    // If tokens were refreshed, persist new cookies in the browser for 30 days
    if (refreshedTokens?.accessToken) {
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days persistent session
      };
      response.cookies.set('_affiliate_x_tkn', refreshedTokens.accessToken, cookieOpts);
      if (refreshedTokens.refreshToken) {
        response.cookies.set('_affiliate_r_tkn', refreshedTokens.refreshToken, cookieOpts);
      }
    }

    return response;
  } catch (err: any) {
    console.error('[Affiliate BFF Error]', endpointPath, err?.message || err);
    return NextResponse.json(
      {
        success: false,
        message: 'Backend server (port 8000) is unreachable. Please ensure electronics-backend is running.',
      },
      {
        status: 502,
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  }
}
