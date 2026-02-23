// ========================================
// GET /api/portal/my-comments
// Get the current user's own comments (auth required)
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    const comments = await context.env.DB.prepare(`
      SELECT c.id, c.content, c.is_anonymous, c.created_at,
             p.title, p.slug
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).bind(user.id).all();

    const results = (comments.results || []).map(c => ({
      id: c.id,
      content: c.content,
      is_anonymous: !!c.is_anonymous,
      created_at: c.created_at,
      post_title: c.title,
      post_slug: c.slug
    }));

    return json(results);

  } catch (e) {
    console.error('GET /api/portal/my-comments error:', e);
    return error('Failed to load your comments.', 500);
  }
}
