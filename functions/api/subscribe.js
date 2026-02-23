// ========================================
// POST /api/subscribe
// Subscribe email to new post notifications
// ========================================

import { json, error } from '../_shared/response.js';
import { generateToken, isValidEmail } from '../_shared/auth.js';
import { sendEmail, welcomeSubscriptionEmail } from '../_shared/email.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = (body.email || '').trim().toLowerCase();

    // Validate email
    if (!isValidEmail(email)) {
      return error('Please enter a valid email address.');
    }

    // Check if already subscribed
    const existing = await context.env.DB.prepare(`
      SELECT id, active FROM subscriptions WHERE email = ?
    `).bind(email).first();

    if (existing && existing.active) {
      return json({ success: true, message: 'Already subscribed.' });
    }

    const siteUrl = context.env.SITE_URL || 'https://amandalevylcsw.com';

    if (existing && !existing.active) {
      // Re-activate existing subscription
      const token = generateToken(32);

      await context.env.DB.prepare(`
        UPDATE subscriptions
        SET active = 1, unsubscribe_token = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(token, existing.id).run();

      const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${token}`;

      await sendEmail(context.env.RESEND_API_KEY, {
        to: email,
        subject: "Welcome back to Amanda Levy's Blog!",
        html: welcomeSubscriptionEmail(unsubscribeUrl)
      });

      return json({ success: true, message: 'You have been re-subscribed.' });
    }

    // New subscription
    const token = generateToken(32);

    await context.env.DB.prepare(`
      INSERT INTO subscriptions (email, unsubscribe_token, active)
      VALUES (?, ?, 1)
    `).bind(email, token).run();

    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${token}`;

    await sendEmail(context.env.RESEND_API_KEY, {
      to: email,
      subject: "Welcome to Amanda Levy's Blog!",
      html: welcomeSubscriptionEmail(unsubscribeUrl)
    });

    return json({ success: true, message: 'Successfully subscribed!' });

  } catch (e) {
    console.error('POST /api/subscribe error:', e);
    return error('Failed to subscribe. Please try again.', 500);
  }
}
