// ========================================
// GET /api/admin/comments
// List all comments across all posts (admin only)
// Includes parent_id and post_id for admin reply
// ========================================

import { json, error } from '../../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const user = context.data.user;
    if (!user || !user.is_admin) {
      return error('Admin access required.', 403);
    }

    const comments = await context.env.DB.prepare(`
      SELECT c.id, c.content, c.is_anonymous, c.created_at,
             c.parent_id, c.post_id, c.user_id,
             u.display_name, u.email,
             p.title AS post_title, p.slug AS post_slug
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `).all();

    const results = (comments.results || []).map(c => ({
      id: c.id,
      content: c.content,
      display_name: c.is_anonymous ? 'Anonymous' : c.display_name,
      is_anonymous: !!c.is_anonymous,
      user_email: c.email,
      post_id: c.post_id,
      post_title: c.post_title,
      post_slug: c.post_slug,
      parent_id: c.parent_id || null,
      created_at: c.created_at
    }));

    return json({ comments: results });

  } catch (e) {
    console.error('GET /api/admin/comments error:', e);
    return error('Failed to load comments.', 500);
  }
}
