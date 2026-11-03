import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return forwardToAffiliateBackend(req, `/support/${id}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return forwardToAffiliateBackend(req, `/support/${id}/reply`, {
    method: 'POST',
    requireAuth: true,
    body,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return forwardToAffiliateBackend(req, `/support/${id}/status`, {
    method: 'PATCH',
    requireAuth: true,
    body,
  });
}

