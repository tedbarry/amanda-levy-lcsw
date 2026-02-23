// ========================================
// GET /api/unsubscribe?token=xxx
// Unsubscribe via email link
// Returns HTML confirmation page
// ========================================

import { html, error } from '../_shared/response.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return html(unsubscribePage(false, 'Invalid unsubscribe link.'), 400);
    }

    const result = await context.env.DB.prepare(`
      UPDATE subscriptions SET active = 0
      WHERE unsubscribe_token = ? AND active = 1
    `).bind(token).run();

    const changed = result.meta?.changes > 0;

    if (changed) {
      return html(unsubscribePage(true, 'You have been unsubscribed.'));
    } else {
      return html(unsubscribePage(true, 'You are already unsubscribed.'));
    }

  } catch (e) {
    console.error('GET /api/unsubscribe error:', e);
    return html(unsubscribePage(false, 'Something went wrong. Please try again.'), 500);
  }
}

function unsubscribePage(success, message) {
  const icon = success
    ? '<div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>'
    : '<div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe - Amanda Levy's Blog</title>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #fefdfb; margin: 0; padding: 40px 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="max-width: 480px; width: 100%; background: white; border-radius: 16px; padding: 48px 40px; border: 1px solid #e8ebe3; text-align: center;">
    ${icon}
    <h1 style="font-family: 'Georgia', serif; color: #363f2e; font-size: 24px; margin: 0 0 12px;">
      ${success ? 'Unsubscribed' : 'Oops'}
    </h1>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
      ${message}
    </p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/blog.html" style="display: inline-block; background-color: #60724d; color: white; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600; font-size: 14px;">
        Return to Blog
      </a>
      <a href="/blog.html" style="display: inline-block; background-color: transparent; color: #60724d; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600; font-size: 14px; border: 1px solid #60724d;">
        Re-subscribe
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 12px; margin: 32px 0 0;">
      Amanda Levy, LCSW
    </p>
  </div>
</body>
</html>`;
}
