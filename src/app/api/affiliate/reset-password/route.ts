import { NextRequest, NextResponse } from 'next/server';
import { fetchBackendUrl, verifyCsrfOrigin } from '@/utils/bffHelper';

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ success: false, message: 'CSRF validation failed' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const res = await fetchBackendUrl(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      req
    );
    const data = await res.json().catch(() => ({ success: false, message: 'Failed to reset password' }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Backend server on port 8000 is unreachable.' },
      { status: 502 }
    );
  }
}
