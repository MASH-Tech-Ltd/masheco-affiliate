import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/referrals', {
    method: 'GET',
    requireAuth: true,
  });
}

