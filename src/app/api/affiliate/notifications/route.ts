import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/notifications', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function PATCH(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/notifications/read-all', {
    method: 'PATCH',
    requireAuth: true,
  });
}
