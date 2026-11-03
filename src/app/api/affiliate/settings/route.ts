import { NextRequest } from 'next/server';
import { forwardToAffiliateBackend } from '@/utils/bffHelper';

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.action === 'change_password') {
    return forwardToAffiliateBackend(req, '/change-password', {
      method: 'PATCH',
      requireAuth: true,
      body: {
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      },
    });
  }

  return forwardToAffiliateBackend(req, '/profile', {
    method: 'PATCH',
    requireAuth: true,
    body: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      avatarUrl: body.avatarUrl,
    },
  });
}

