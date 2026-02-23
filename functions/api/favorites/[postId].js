// ========================================
// POST /api/favorites/:postId
// Toggle favorite on a post (auth required)
// ========================================

import { json, error } from '../../_shared/response.js';

export async function onRequestPost(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    const postId = context.params.postId;
    if (!postId) {
      return error('Post ID is required.', 400);
    }

    // Check if already favorited
    const existing = await context.env.DB.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND post_id = ?
    `).bind(user.id, postId).first();

    if (existing) {
      // Unfavorite
      await context.env.DB.prepare(`
        DELETE FROM favorites WHERE id = ?
      `).bind(existing.id).run();

      return json({ favorited: false });
    } else {
      // Favorite
      await context.env.DB.prepare(`
        INSERT INTO favorites (user_id, post_id) VALUES (?, ?)
      `).bind(user.id, postId).run();

      return json({ favorited: true });
    }

  } catch (e) {
    console.error('POST /api/favorites/:postId error:', e);
    return error('Failed to update favorite.', 500);
  }
}
