// ========================================
// GET /api/admin/users
// List all users (admin only)
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const user = context.data.user;
    if (!user || !user.is_admin) {
      return error('Admin access required.', 403);
    }

    const users = await context.env.DB.prepare(`
      SELECT id, email, display_name, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return json({ users: users.results || [] });

  } catch (e) {
    console.error('GET /api/admin/users error:', e);
    return error('Failed to load users.', 500);
  }
}
