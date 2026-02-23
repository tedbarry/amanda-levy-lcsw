// ========================================
// GET /api/comments/:postId
// Get all comments for a specific post
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const postId = context.params.postId;

    if (!postId) {
      return error('Post ID is required.', 400);
    }

    const currentUserId = context.data.user?.id || null;

    const comments = await context.env.DB.prepare(`
      SELECT c.id, c.content, c.is_anonymous, c.created_at,
             u.display_name, c.user_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).bind(postId).all();

    const results = (comments.results || []).map(c => ({
      id: c.id,
      content: c.content,
      display_name: c.is_anonymous ? 'Anonymous' : c.display_name,
      is_anonymous: !!c.is_anonymous,
      is_own: currentUserId !== null && c.user_id === currentUserId,
      created_at: c.created_at
    }));

    return json({ comments: results });

  } catch (e) {
    console.error('GET /api/comments/:postId error:', e);
    return error('Failed to load comments.', 500);
  }
}
