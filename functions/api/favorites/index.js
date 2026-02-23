// ========================================
// GET /api/favorites
// Get user's favorited posts (auth required)
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    const favorites = await context.env.DB.prepare(`
      SELECT p.id, p.slug, p.title, p.excerpt, p.published_at
      FROM favorites f
      JOIN posts p ON f.post_id = p.id
      WHERE f.user_id = ? AND p.status = 'published'
      ORDER BY f.created_at DESC
    `).bind(user.id).all();

    return json(favorites.results || []);

  } catch (e) {
    console.error('GET /api/favorites error:', e);
    return error('Failed to load favorites.', 500);
  }
}
