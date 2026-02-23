// ========================================
// Database Helpers
// Slug generation, pagination, utilities
// ========================================

/**
 * Generate a URL-safe slug from a title string.
 * Example: "My First Blog Post!" -> "my-first-blog-post"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')       // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 100);            // Max 100 chars
}

/**
 * Calculate pagination offset from page number.
 * @param {number} page - 1-based page number
 * @param {number} perPage - items per page (default 10)
 * @returns {{ limit: number, offset: number }}
 */
export function paginate(page = 1, perPage = 10) {
  const p = Math.max(1, parseInt(page) || 1);
  const offset = (p - 1) * perPage;
  return { limit: perPage, offset, page: p };
}

/**
 * Format a date string for display.
 * Input: "2026-02-22 14:30:00" (SQLite datetime)
 * Output: "Feb 22, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z'); // Treat as UTC
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Ensure a slug is unique by appending a number if needed.
 * Queries the DB to check for existing slugs.
 */
export async function uniqueSlug(db, baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.prepare(
      'SELECT id FROM posts WHERE slug = ?'
    ).bind(slug).first();

    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
