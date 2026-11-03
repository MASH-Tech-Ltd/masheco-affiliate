import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/payment-methods', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function PUT(req: NextRequest) {
  return forwardToAffiliateBackend(req, '/payment-methods', {
    method: 'PUT',
    requireAuth: true,
  });
}

