import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendUrl, verifyCsrfOrigin } from '@/utils/bffHelper';

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { success: false, message: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const backendRes = await fetchBackendUrl(
      '/affiliates/register',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      req
    );

    const data = await backendRes.json().catch(() => ({
      success: false,
      message: 'Invalid response from backend registration service',
    }));

    const res = NextResponse.json(data, {
      status: backendRes.status,
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });

    if (backendRes.ok && data?.data?.accessToken) {
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days persistent session
        path: '/',
      };
      res.cookies.set('_affiliate_x_tkn', data.data.accessToken, cookieOpts);
      if (data.data.refreshToken) {
        res.cookies.set('_affiliate_r_tkn', data.data.refreshToken, cookieOpts);
      }
    }

    return res;
  } catch (err: any) {
    console.error('[Affiliate Register BFF Error]', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        message: 'Backend server on port 8000 is unreachable. Please ensure electronics-backend is running.',
      },
      { status: 502 }
    );
  }
}
