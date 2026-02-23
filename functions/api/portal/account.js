// ========================================
// DELETE /api/portal/account
// Delete user account (auth required)
// Cannot delete admin accounts
// ========================================

import { json, error } from '../../_shared/response.js';
import { clearSessionCookie } from '../../_shared/auth.js';

export async function onRequestDelete(context) {
  try {
    const user = context.data.user;
    if (!user) {
      return error('You must be signed in.', 401);
    }

    // Prevent admin account deletion
    if (user.is_admin) {
      return error('Admin accounts cannot be deleted.', 403);
    }

    const db = context.env.DB;
    const userId = user.id;

    // Delete in order to respect foreign key constraints:
    // 1. Sessions
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

    // 2. Favorites
    await db.prepare('DELETE FROM favorites WHERE user_id = ?').bind(userId).run();

    // 3. Comments
    await db.prepare('DELETE FROM comments WHERE user_id = ?').bind(userId).run();

    // 4. User
    await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    // Clear session cookie
    return json(
      { success: true },
      200,
      { 'Set-Cookie': clearSessionCookie() }
    );

  } catch (e) {
    console.error('DELETE /api/portal/account error:', e);
    return error('Failed to delete account.', 500);
  }
}
