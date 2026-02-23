// ========================================
// GET /api/auth/me
// Return current user info from session
// ========================================

import { json } from '../../_shared/response.js';

export async function onRequestGet(context) {
  const user = context.data.user;

  if (!user) {
    return json({ user: null });
  }

  return json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_admin: user.is_admin
    }
  });
}
