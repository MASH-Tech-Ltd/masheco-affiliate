import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfOrigin } from '@/utils/bffHelper';

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json(
      { success: false, message: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  const res = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      status: 200,
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    }
  );

  res.cookies.delete('_affiliate_x_tkn');
  res.cookies.delete('_affiliate_r_tkn');
  return res;
}

