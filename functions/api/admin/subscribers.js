// ========================================
// GET /api/admin/subscribers
// List all subscribers (admin only)
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const user = context.data.user;
    if (!user || !user.is_admin) {
      return error('Admin access required.', 403);
    }

    const subscribers = await context.env.DB.prepare(`
      SELECT * FROM subscriptions ORDER BY created_at DESC
    `).all();

    const results = subscribers.results || [];

    return json({
      subscribers: results,
      total: results.length
    });

  } catch (e) {
    console.error('GET /api/admin/subscribers error:', e);
    return error('Failed to load subscribers.', 500);
  }
}
