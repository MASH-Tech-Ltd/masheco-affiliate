import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('_affiliate_x_tkn')?.value;
  const refreshToken = request.cookies.get('_affiliate_r_tkn')?.value;
  const hasAuth = Boolean(accessToken || refreshToken);

  // If authenticated and visiting root landing, login, or register -> redirect to dashboard
  if (hasAuth && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If not authenticated and visiting protected dashboard -> redirect to login
  if (!hasAuth && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
  ],
};

