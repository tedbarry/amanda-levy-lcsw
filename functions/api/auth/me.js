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

  // Auto-promote admin email if not already flagged in DB
  const adminEmail = (context.env.ADMIN_EMAIL || '').toLowerCase();
  let isAdmin = !!user.is_admin;

  if (user.email === adminEmail && !user.is_admin) {
    // Promote in DB so future requests are fast
    try {
      await context.env.DB.prepare(
        'UPDATE users SET is_admin = 1 WHERE id = ?'
      ).bind(user.id).run();
      isAdmin = true;
    } catch (e) {
      console.error('Auto-promote admin failed:', e);
    }
  }

  return json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_admin: isAdmin
    }
  });
}
