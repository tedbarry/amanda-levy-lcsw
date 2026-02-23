// ========================================
// DELETE /api/comments/delete/:id
// Delete a comment (owner or admin)
// ========================================

import { json, error } from '../../../_shared/response.js';

export async function onRequestDelete(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    const commentId = context.params.id;
    if (!commentId) {
      return error('Comment ID is required.', 400);
    }

    // Look up the comment
    const comment = await context.env.DB.prepare(`
      SELECT id, user_id FROM comments WHERE id = ?
    `).bind(commentId).first();

    if (!comment) {
      return error('Comment not found.', 404);
    }

    // Authorization: user owns the comment OR user is admin
    if (comment.user_id !== user.id && !user.is_admin) {
      return error('You do not have permission to delete this comment.', 403);
    }

    await context.env.DB.prepare(`
      DELETE FROM comments WHERE id = ?
    `).bind(commentId).run();

    return json({ success: true });

  } catch (e) {
    console.error('DELETE /api/comments/delete/:id error:', e);
    return error('Failed to delete comment.', 500);
  }
}
