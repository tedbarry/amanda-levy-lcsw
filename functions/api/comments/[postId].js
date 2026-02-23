// ========================================
// GET /api/comments/:postId
// Get all comments for a specific post
// Includes parent_id, like counts, admin-liked, user-liked
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
             c.parent_id, c.user_id,
             u.display_name, u.is_admin AS user_is_admin,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
             (SELECT COUNT(*) FROM comment_likes cl
              JOIN users au ON cl.user_id = au.id
              WHERE cl.comment_id = c.id AND au.is_admin = 1) AS admin_liked,
             ${currentUserId
               ? `(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ${Number(currentUserId)}) AS user_liked`
               : '0 AS user_liked'}
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
      is_admin_author: !!c.user_is_admin,
      parent_id: c.parent_id || null,
      like_count: c.like_count || 0,
      admin_liked: c.admin_liked > 0,
      user_liked: c.user_liked > 0,
      created_at: c.created_at
    }));

    return json({ comments: results });

  } catch (e) {
    console.error('GET /api/comments/:postId error:', e);
    return error('Failed to load comments.', 500);
  }
}
