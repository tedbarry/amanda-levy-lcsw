// ========================================
// /api/posts
// GET  â€” List published posts (public, paginated)
// POST â€” Create new post (admin only)
// ========================================

import { json, error } from '../../_shared/response.js';
import { slugify, uniqueSlug, paginate } from '../../_shared/db.js';
import { escapeHtml } from '../../_shared/auth.js';
import { sendEmail, newPostEmail } from '../../_shared/email.js';

// ----------------------------------------
// GET /api/posts
// Public â€” returns published posts
// Admin with ?all=1 â€” includes drafts
// ----------------------------------------
export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    const user = context.data.user;
    const url = new URL(context.request.url);

    const page = parseInt(url.searchParams.get('page')) || 1;
    const searchQuery = (url.searchParams.get('q') || '').trim();
    const showAll = url.searchParams.get('all') === '1';
    const perPage = 10;

    const { limit, offset, page: currentPage } = paginate(page, perPage);

    // Build WHERE clause
    const conditions = [];
    const bindings = [];

    // Only admins can see drafts, and only when explicitly requesting them
    if (!(showAll && user && user.is_admin)) {
      conditions.push("p.status = 'published'");
    }

    // Search by title
    if (searchQuery) {
      conditions.push('p.title LIKE ?');
      bindings.push(`%${searchQuery}%`);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const countResult = await db.prepare(countSql).bind(...bindings).first();
    const total = countResult ? countResult.total : 0;

    // Get paginated posts with comment counts
    const listSql = `
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.status,
        p.published_at,
        p.created_at,
        COUNT(c.id) AS comment_count
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY COALESCE(p.published_at, p.created_at) DESC
      LIMIT ? OFFSET ?
    `;

    const listBindings = [...bindings, limit, offset];
    const { results: posts } = await db.prepare(listSql).bind(...listBindings).all();

    return json({
      posts: posts || [],
      pagination: {
        page: currentPage,
        perPage,
        total,
        hasMore: offset + limit < total
      }
    });

  } catch (e) {
    console.error('GET /api/posts error:', e);
    return error('Failed to fetch posts.', 500);
  }
}

// ----------------------------------------
// POST /api/posts
// Admin only â€” create a new blog post
// ----------------------------------------
export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const user = context.data.user;

    // Auth check: must be logged-in admin
    if (!user || !user.is_admin) {
      return error('Unauthorized.', 401);
    }

    const body = await context.request.json();

    // Extract and validate fields
    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const excerpt = (body.excerpt || '').trim();
    const status = body.status === 'published' ? 'published' : 'draft';

    if (!title) {
      return error('Title is required.');
    }
    if (!content) {
      return error('Content is required.');
    }

    // Generate a unique slug from the title
    const baseSlug = slugify(title);
    if (!baseSlug) {
      return error('Title must contain at least one valid character.');
    }
    const slug = await uniqueSlug(db, baseSlug);

    // Set published_at if publishing now
    const publishedAt = status === 'published' ? "datetime('now')" : null;

    // Insert the post
    // We need to handle the datetime('now') as a SQL expression, not a bound param
    let insertSql;
    let insertBindings;

    if (status === 'published') {
      insertSql = `
        INSERT INTO posts (slug, title, content, excerpt, status, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
      `;
      insertBindings = [slug, title, content, excerpt, status];
    } else {
      insertSql = `
        INSERT INTO posts (slug, title, content, excerpt, status, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, datetime('now'), datetime('now'))
      `;
      insertBindings = [slug, title, content, excerpt, status];
    }

    await db.prepare(insertSql).bind(...insertBindings).run();

    // Fetch the newly created post
    const post = await db.prepare(
      'SELECT * FROM posts WHERE slug = ?'
    ).bind(slug).first();

    // If published, notify subscribers
    if (status === 'published' && post) {
      await notifySubscribers(context, post);
    }

    return json(post, 201);

  } catch (e) {
    console.error('POST /api/posts error:', e);
    return error('Failed to create post.', 500);
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

    const postUrl = `${siteUrl}/blog/${post.slug}`;

    // Send emails in parallel (fire-and-forget, don't block the response)
    const emailPromises = subscribers.map(sub => {
      const unsubscribeUrl = `${siteUrl}/api/subscribers/unsubscribe?token=${sub.unsubscribe_token}`;
      const emailHtml = newPostEmail(
        escapeHtml(post.title),
        escapeHtml(post.excerpt || ''),
        postUrl,
        unsubscribeUrl
      );

      return sendEmail(apiKey, {
        to: sub.email,
        subject: `New Post: ${post.title}`,
        html: emailHtml
      });
    });

    // Wait for all emails but don't fail the request if some fail
    const results = await Promise.allSettled(emailPromises);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value));
    if (failed.length > 0) {
      console.error(`Failed to send ${failed.length}/${subscribers.length} notification emails.`);
    }

  } catch (e) {
    // Don't let email failures break the post creation
    console.error('notifySubscribers error:', e);
  }
}
