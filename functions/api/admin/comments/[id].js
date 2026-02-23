// ========================================
// DELETE /api/admin/comments/:id
// Delete any comment (admin only)
// ========================================

import { json, error } from '../../../_shared/response.js';

export async function onRequestDelete(context) {
  try {
    const user = context.data.user;
    if (!user || !user.is_admin) {
      return error('Admin access required.', 403);
    }

    const commentId = context.params.id;
    if (!commentId) {
      return error('Comment ID is required.', 400);
    }

    // Verify comment exists
    const comment = await context.env.DB.prepare(`
      SELECT id FROM comments WHERE id = ?
    `).bind(commentId).first();

    if (!comment) {
      return error('Comment not found.', 404);
    }

    await context.env.DB.prepare(`
      DELETE FROM comments WHERE id = ?
    `).bind(commentId).run();

    return json({ success: true });

  } catch (e) {
    console.error('DELETE /api/admin/comments/:id error:', e);
    return error('Failed to delete comment.', 500);
  }
}
