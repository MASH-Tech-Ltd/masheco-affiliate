import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/support', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardToAffiliateBackend(req, '/support', {
    method: 'POST',
    requireAuth: true,
    body,
  });
}

