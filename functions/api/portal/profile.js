// ========================================
// PUT /api/portal/profile
// Update user display name (auth required)
// ========================================

import { json, error } from '../../_shared/response.js';
import { escapeHtml } from '../../_shared/auth.js';

export async function onRequestPut(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    const body = await context.request.json();
    let displayName = body.display_name;

    // Validate presence
    if (!displayName || typeof displayName !== 'string') {
      return error('Display name is required.');
    }

    // Strip HTML tags and trim whitespace
    displayName = displayName.replace(/<[^>]*>/g, '').trim();

    // Validate length
    if (displayName.length < 1 || displayName.length > 50) {
      return error('Display name must be between 1 and 50 characters.');
    }

    // Escape remaining HTML entities for safe storage
    const cleanName = escapeHtml(displayName);

    await context.env.DB.prepare(`
      UPDATE users SET display_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(cleanName, user.id).run();

    return json({ success: true, display_name: cleanName });

  } catch (e) {
    console.error('PUT /api/portal/profile error:', e);
    return error('Failed to update profile.', 500);
  }
}
