// ========================================
// POST /api/comments
// Create a new comment (auth required)
// Supports threaded replies via parent_id
// ========================================

import { json, error } from '../../_shared/response.js';
import { escapeHtml } from '../../_shared/auth.js';

export async function onRequestPost(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in to comment.', 401);
    }

    const body = await context.request.json();
    const { content, is_anonymous } = body;
    let { post_id, parent_id } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return error('Comment cannot be empty.');
    }

    if (content.length > 2000) {
      return error('Comment must be 2000 characters or fewer.');
    }

    // If parent_id is provided, validate and derive post_id from parent
    if (parent_id) {
      const parent = await context.env.DB.prepare(`
        SELECT id, post_id, parent_id FROM comments WHERE id = ?
      `).bind(parent_id).first();

      if (!parent) {
        return error('Parent comment not found.', 404);
      }

      // Flatten to 1-level nesting: if parent is itself a reply, use its parent_id
      if (parent.parent_id) {
        parent_id = parent.parent_id;
      }

      // Derive post_id from parent (so admin reply doesn't need to supply it)
      post_id = parent.post_id;
    }

    // Validate post exists and is published
    if (!post_id) {
      return error('Post ID is required.');
    }

    const post = await context.env.DB.prepare(`
      SELECT id FROM posts WHERE id = ? AND status = 'published'
    `).bind(post_id).first();

    if (!post) {
      return error('Post not found.', 404);
    }

    // Rate limit: max 10 comments per user per hour
    const recentCount = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE user_id = ? AND created_at > datetime('now', '-1 hour')
    `).bind(user.id).first();

    if (recentCount && recentCount.count >= 10) {
      return error('You are commenting too frequently. Please wait a bit and try again.', 429);
    }

    // Sanitize content
    const safeContent = escapeHtml(content.trim());
    const anonFlag = is_anonymous ? 1 : 0;

    // Insert comment
    const result = await context.env.DB.prepare(`
      INSERT INTO comments (post_id, user_id, content, is_anonymous, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(post_id, user.id, safeContent, anonFlag, parent_id || null).run();

    const commentId = result.meta?.last_row_id;

    return json({
      id: commentId,
      post_id: post_id,
      parent_id: parent_id || null,
      content: safeContent,
      display_name: anonFlag ? 'Anonymous' : user.display_name,
      is_anonymous: !!anonFlag,
      is_own: true,
      created_at: new Date().toISOString()
    }, 201);

  } catch (e) {
    console.error('POST /api/comments error:', e);
    return error('Failed to create comment.', 500);
  }
}
