// ========================================
// POST /api/auth/send-magic-link
// Send a magic link email to the user
// ========================================

import { json, error } from '../../_shared/response.js';
import { generateToken, isValidEmail } from '../../_shared/auth.js';
import { sendEmail, magicLinkEmail } from '../../_shared/email.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();

    // Validate email
    if (!isValidEmail(email)) {
      return error('Please enter a valid email address.');
    }

    // Rate limit: max 3 magic links per email per 15 minutes
    const recentCount = await context.env.DB.prepare(`
      SELECT COUNT(*) as count FROM auth_tokens
      WHERE email = ? AND created_at > datetime('now', '-15 minutes')
    `).bind(email).first();

    if (recentCount && recentCount.count >= 3) {
      return error('Too many sign-in attempts. Please wait a few minutes and try again.', 429);
    }

    // Generate token and expiry
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');

    // Store token in database
    await context.env.DB.prepare(`
      INSERT INTO auth_tokens (email, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(email, token, expiresAt).run();

    // Build verify URL
    const siteUrl = context.env.SITE_URL || 'https://amandalevylcsw.com';
    const verifyUrl = `${siteUrl}/api/auth/verify?token=${token}`;

    // Send magic link email
    const sent = await sendEmail(context.env.RESEND_API_KEY, {
      to: email,
      subject: "Sign in to Amanda Levy's Blog",
      html: magicLinkEmail(verifyUrl)
    });

    if (!sent) {
      return error('Unable to send email. Please try again.', 500);
    }

    return json({ success: true, message: 'Magic link sent! Check your email.' });

  } catch (e) {
    console.error('send-magic-link error:', e.message, e.stack);
    return error('Something went wrong. Please try again.', 500);
  }
}
