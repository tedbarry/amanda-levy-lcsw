// ========================================
// POST /api/auth/logout
// Clear session from DB and cookie
// ========================================

import { json, error } from '../../_shared/response.js';
import { parseCookie, clearSessionCookie } from '../../_shared/auth.js';

export async function onRequestPost(context) {
  try {
    // Get session token from cookie
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const sessionToken = parseCookie(cookieHeader, 'session');

    if (sessionToken) {
      // Delete session from database
      await context.env.DB.prepare(
        'DELETE FROM sessions WHERE token = ?'
      ).bind(sessionToken).run();
    }

    // Clear cookie
    return json({ success: true }, 200, {
      'Set-Cookie': clearSessionCookie()
    });

  } catch (e) {
    console.error('logout error:', e);
    return error('Something went wrong.', 500);
  }
}
