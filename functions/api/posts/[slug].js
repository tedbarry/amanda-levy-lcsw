// ========================================
// /api/posts/:slug
// GET    — Get single post by slug
// PUT    — Update post (admin only)
// DELETE — Delete post (admin only)
// ========================================

import { json, error } from '../../_shared/response.js';
import { sendEmail, newPostEmail } from '../../_shared/email.js';

// ----------------------------------------
// GET /api/posts/:slug
// Public — returns a single published post
// Admins can view drafts
// ----------------------------------------
export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    const user = context.data.user;
    const { slug } = context.params;

    if (!slug) {
      return error('Post slug is required.', 400);
    }

    // Fetch the post with its comment count
    const post = await db.prepare(`
      SELECT
        p.*,
        COUNT(c.id) AS comment_count
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE p.slug = ?
      GROUP BY p.id
    `).bind(slug).first();

    if (!post) {
      return error('Post not found.', 404);
    }

    // Draft posts are only visible to admins
    if (post.status !== 'published') {
      if (!user || !user.is_admin) {
        return error('Post not found.', 404);
      }
    }

    return json({ post });

  } catch (e) {
    console.error('GET /api/posts/:slug error:', e);
    return error('Failed to fetch post.', 500);
  }
}

// ----------------------------------------
// PUT /api/posts/:slug
// Admin only — update an existing post
// ----------------------------------------
export async function onRequestPut(context) {
  try {
    const db = context.env.DB;
    const user = context.data.user;
    const { slug } = context.params;

    // Auth check: must be logged-in admin
    if (!user || !user.is_admin) {
      return error('Unauthorized.', 401);
    }

    if (!slug) {
      return error('Post slug is required.', 400);
    }

    // Find the existing post
    const existing = await db.prepare(
      'SELECT * FROM posts WHERE slug = ?'
    ).bind(slug).first();

    if (!existing) {
      return error('Post not found.', 404);
    }

    const body = await context.request.json();

    // Use existing values as defaults; only override what is provided
    const title = body.title !== undefined ? (body.title || '').trim() : existing.title;
    const content = body.content !== undefined ? (body.content || '').trim() : existing.content;
    const excerpt = body.excerpt !== undefined ? (body.excerpt || '').trim() : existing.excerpt;
    const status = body.status !== undefined
      ? (body.status === 'published' ? 'published' : 'draft')
      : existing.status;

    // Validate required fields
    if (!title) {
      return error('Title is required.');
    }
    if (!content) {
      return error('Content is required.');
    }

    // Determine if we're transitioning from draft to published
    const isNewlyPublished = existing.status !== 'published' && status === 'published';

    // Build the update query
    // If newly published, set published_at; otherwise keep existing value
    let updateSql;
    let updateBindings;

    if (isNewlyPublished) {
      updateSql = `
        UPDATE posts
        SET title = ?, content = ?, excerpt = ?, status = ?,
            published_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `;
      updateBindings = [title, content, excerpt, status, existing.id];
    } else {
      updateSql = `
        UPDATE posts
        SET title = ?, content = ?, excerpt = ?, status = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `;
      updateBindings = [title, content, excerpt, status, existing.id];
    }

    await db.prepare(updateSql).bind(...updateBindings).run();

    // Fetch the updated post
    const updated = await db.prepare(
      'SELECT * FROM posts WHERE id = ?'
    ).bind(existing.id).first();

    // If transitioning to published, notify subscribers
    if (isNewlyPublished && updated) {
      await notifySubscribers(context, updated);
    }

    return json({ post: updated });

  } catch (e) {
    console.error('PUT /api/posts/:slug error:', e);
    return error('Failed to update post.', 500);
  }
}

// ----------------------------------------
// DELETE /api/posts/:slug
// Admin only — delete a post and its
// associated comments and favorites
// ----------------------------------------
export async function onRequestDelete(context) {
  try {
    const db = context.env.DB;
    const user = context.data.user;
    const { slug } = context.params;

    // Auth check: must be logged-in admin
    if (!user || !user.is_admin) {
      return error('Unauthorized.', 401);
    }

    if (!slug) {
      return error('Post slug is required.', 400);
    }

    // Find the post
    const post = await db.prepare(
      'SELECT id FROM posts WHERE slug = ?'
    ).bind(slug).first();

    if (!post) {
      return error('Post not found.', 404);
    }

    // CASCADE delete: remove comments, favorites, then the post itself
    // D1 may not support ON DELETE CASCADE, so delete manually in order
    await db.batch([
      db.prepare('DELETE FROM comments WHERE post_id = ?').bind(post.id),
      db.prepare('DELETE FROM favorites WHERE post_id = ?').bind(post.id),
      db.prepare('DELETE FROM posts WHERE id = ?').bind(post.id)
    ]);

    return json({ success: true });

  } catch (e) {
    console.error('DELETE /api/posts/:slug error:', e);
    return error('Failed to delete post.', 500);
  }
}

// ----------------------------------------
// Helper: Send notification emails to all
// active subscribers about a new post
// ----------------------------------------
async function notifySubscribers(context, post) {
  try {
    const db = context.env.DB;
    const apiKey = context.env.RESEND_API_KEY;
    const siteUrl = context.env.SITE_URL || 'https://amandalevylcsw.com';

    if (!apiKey) {
      console.error('RESEND_API_KEY not configured, skipping notifications.');
      return;
    }

    // Get all active subscribers
    const { results: subscribers } = await db.prepare(
      "SELECT id, email, unsubscribe_token FROM subscriptions WHERE active = 1"
    ).all();

    if (!subscribers || subscribers.length === 0) return;

    const postUrl = `${siteUrl}/post.html?slug=${encodeURIComponent(post.slug)}`;

    // Send emails in parallel
    const emailPromises = subscribers.map(sub => {
      const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${sub.unsubscribe_token}`;
      const emailHtml = newPostEmail(
        post.title,
        post.excerpt || '',
        postUrl,
        unsubscribeUrl
      );

      return sendEmail(apiKey, {
        to: sub.email,
        subject: `New Post: ${post.title}`,
        html: emailHtml
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value));
    if (failed.length > 0) {
      console.error(`Failed to send ${failed.length}/${subscribers.length} notification emails.`);
    }

  } catch (e) {
    console.error('notifySubscribers error:', e);
  }
}
