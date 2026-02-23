// ========================================
// POST /api/comments/like/:id
// Toggle like on a comment (auth required)
// ========================================

import { json, error } from '../../../_shared/response.js';

export async function onRequestPost(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in to like a comment.', 401);
    }

    const commentId = context.params.id;
    if (!commentId) {
      return error('Comment ID is required.', 400);
    }

    // Verify comment exists
    const comment = await context.env.DB.prepare(
      'SELECT id FROM comments WHERE id = ?'
    ).bind(commentId).first();

    if (!comment) {
      return error('Comment not found.', 404);
    }

    // Check if already liked
    const existing = await context.env.DB.prepare(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?'
    ).bind(commentId, user.id).first();

    if (existing) {
      // Unlike
      await context.env.DB.prepare(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?'
      ).bind(commentId, user.id).run();
      return json({ liked: false });
    } else {
      // Like
      await context.env.DB.prepare(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)'
      ).bind(commentId, user.id).run();
      return json({ liked: true });
    }

  } catch (e) {
    console.error('POST /api/comments/like/:id error:', e);
    return error('Failed to toggle like.', 500);
  }
}
