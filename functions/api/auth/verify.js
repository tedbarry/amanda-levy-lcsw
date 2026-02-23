// ========================================
// GET /api/auth/verify?token=xxx
// Verify magic link token, create session,
// set cookie, redirect to blog or portal
// ========================================

import { redirect } from '../../_shared/response.js';
import { generateToken, buildSessionCookie } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return redirect('/login.html?error=invalid');
    }

    // Look up token — must be unused and not expired
    const authToken = await context.env.DB.prepare(`
      SELECT * FROM auth_tokens
      WHERE token = ? AND used = 0 AND expires_at > datetime('now')
    `).bind(token).first();

    if (!authToken) {
      return redirect('/login.html?error=expired');
    }

    // Mark token as used
    await context.env.DB.prepare(
      'UPDATE auth_tokens SET used = 1 WHERE id = ?'
    ).bind(authToken.id).run();

    // Look up or create user
    let user = await context.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(authToken.email).first();

    let isNewUser = false;

    // Check if this email is the admin email
    const adminEmail = (context.env.ADMIN_EMAIL || '').toLowerCase();
    const isAdminEmail = authToken.email === adminEmail;

    if (!user) {
      // Create new user — display name from email prefix
      const displayName = authToken.email.split('@')[0].substring(0, 30);
      isNewUser = true;

      await context.env.DB.prepare(`
        INSERT INTO users (email, display_name, is_admin)
        VALUES (?, ?, ?)
      `).bind(authToken.email, displayName, isAdminEmail ? 1 : 0).run();

      user = await context.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(authToken.email).first();
    } else if (isAdminEmail && !user.is_admin) {
      // Auto-promote admin email if not already admin
      await context.env.DB.prepare(
        'UPDATE users SET is_admin = 1 WHERE id = ?'
      ).bind(user.id).run();
      user.is_admin = 1;
    }

    // Create session (30-day expiry)
    const sessionToken = generateToken(64);
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').replace('Z', '');

    await context.env.DB.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, sessionToken, sessionExpiry).run();

    // Set session cookie and redirect
    const cookie = buildSessionCookie(sessionToken);
    const redirectUrl = isNewUser ? '/portal.html?welcome=1' : '/blog.html';

    return redirect(redirectUrl, {
      'Set-Cookie': cookie
    });

  } catch (e) {
    console.error('verify error:', e);
    return redirect('/login.html?error=unknown');
  }
}
