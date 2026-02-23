// ========================================
// Resend.com Email Helper
// Sends transactional emails for magic links,
// subscription notifications, and welcome emails
// ========================================

/**
 * Send an email via Resend.com API.
 * @param {string} apiKey - Resend API key
 * @param {object} options - { to, subject, html }
 * @returns {boolean} - true if sent successfully
 */
export async function sendEmail(apiKey, { to, subject, html }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Amanda Levy Blog <blog@amandalevylcsw.com>',
        to: [to],
        subject,
        html
      })
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('Resend API error:', res.status, errBody);
    }
    return res.ok;
  } catch (e) {
    console.error('Email send failed:', e);
    return false;
  }
}

/**
 * Magic link email HTML template.
 */
export function magicLinkEmail(verifyUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #fefdfb; padding: 40px 20px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e8ebe3;">
    <h1 style="font-family: 'Georgia', serif; color: #363f2e; font-size: 24px; margin: 0 0 8px;">
      Amanda Levy's Blog
    </h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 32px;">Sign in to your account</p>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Click the button below to sign in. This link expires in 15 minutes.
    </p>

    <a href="${verifyUrl}" style="display: inline-block; background-color: #60724d; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
      Sign In
    </a>

    <p style="color: #9ca3af; font-size: 13px; margin: 32px 0 0; line-height: 1.5;">
      If you didn't request this email, you can safely ignore it.<br>
      This link will expire in 15 minutes.
    </p>

    <p style="color: #d1d5db; font-size: 12px; margin: 24px 0 0;">
      Can't click the button? Copy this link:<br>
      <span style="color: #9ca3af; word-break: break-all;">${verifyUrl}</span>
    </p>
  </div>
</body>
</html>`;
}

/**
 * New post notification email HTML template.
 */
export function newPostEmail(title, excerpt, postUrl, unsubscribeUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #fefdfb; padding: 40px 20px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e8ebe3;">
    <p style="color: #60724d; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 8px;">
      New Blog Post
    </p>
    <h1 style="font-family: 'Georgia', serif; color: #363f2e; font-size: 24px; margin: 0 0 16px; line-height: 1.3;">
      ${title}
    </h1>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      ${excerpt || ''}
    </p>

    <a href="${postUrl}" style="display: inline-block; background-color: #60724d; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
      Read the Full Post
    </a>

    <hr style="border: none; border-top: 1px solid #e8ebe3; margin: 32px 0;">

    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
      You're receiving this because you subscribed at amandalevylcsw.com.<br>
      <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Welcome subscription email HTML template.
 */
export function welcomeSubscriptionEmail(unsubscribeUrl) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #fefdfb; padding: 40px 20px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e8ebe3;">
    <h1 style="font-family: 'Georgia', serif; color: #363f2e; font-size: 24px; margin: 0 0 16px;">
      Welcome!
    </h1>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      You're now subscribed to Amanda Levy's Blog. You'll receive an email whenever a new post is published.
    </p>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      Amanda writes about therapy, mental health, and personal growth — topics that matter to your well-being.
    </p>

    <a href="https://amandalevylcsw.com/blog.html" style="display: inline-block; background-color: #60724d; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
      Visit the Blog
    </a>

    <hr style="border: none; border-top: 1px solid #e8ebe3; margin: 32px 0;">

    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
      Changed your mind? <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}
