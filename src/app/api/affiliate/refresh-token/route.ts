import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchBackendUrl, verifyCsrfOrigin } from '@/utils/bffHelper';

const SESSION_SECONDS = 30 * 24 * 60 * 60; // 30 days persistent session

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { success: false, message: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get('_affiliate_r_tkn')?.value;

    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body?.refreshToken;
      } catch {
        // No body
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'No refresh token available' },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: `_affiliate_r_tkn=${refreshToken}`,
    };

    const backendRes = await fetchBackendUrl(
      '/affiliates/refresh-token',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      },
      req
    );

    const data = await backendRes.json().catch(() => ({
      success: false,
      message: 'Invalid response from refresh-token endpoint',
    }));

    const res = NextResponse.json(data, {
      status: backendRes.status,
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_SECONDS,
    };

    if (backendRes.ok && data?.data?.accessToken) {
      res.cookies.set('_affiliate_x_tkn', data.data.accessToken, cookieOpts);
      if (data.data.refreshToken) {
        res.cookies.set('_affiliate_r_tkn', data.data.refreshToken, cookieOpts);
      }
    } else if (backendRes.status === 401 || backendRes.status === 403) {
      // Clear cookies on real auth failure
      const clearOpts = { ...cookieOpts, maxAge: 0 };
      res.cookies.set('_affiliate_x_tkn', '', clearOpts);
      res.cookies.set('_affiliate_r_tkn', '', clearOpts);
    }

    return res;
  } catch (err: any) {
    console.error('[Affiliate Refresh-Token BFF Error]', err?.message || err);
    return NextResponse.json(
      { success: false, message: 'Backend unreachable during token refresh' },
      { status: 502 }
    );
  }
}

