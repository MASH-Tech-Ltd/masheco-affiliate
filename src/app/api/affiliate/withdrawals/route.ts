import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/withdrawals', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function POST(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/withdrawals', {
    method: 'POST',
    requireAuth: true,
  });
}

