import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToAffiliateBackend(req, `/notifications/${id}/read`, {
    method: 'PATCH',
    requireAuth: true,
  });
}

