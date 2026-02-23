// ========================================
// Cloudflare Pages Functions Middleware
// Runs before every API request
//
// Responsibilities:
// 1. Parse session cookie and attach user to context
// 2. Add security headers to all responses
// ========================================

import { getUserFromSession, parseCookie } from './_shared/auth.js';

export async function onRequest(context) {
  // Parse session cookie from request
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const sessionToken = parseCookie(cookieHeader, 'session');

  // Look up user from session (null if not logged in)
  if (sessionToken) {
    try {
      context.data.user = await getUserFromSession(context.env.DB, sessionToken);
    } catch (e) {
      // DB error — treat as not logged in
      console.error('Middleware auth error:', e);
      context.data.user = null;
    }
  } else {
    context.data.user = null;
  }

  // Continue to the actual handler
  const response = await context.next();

  // Add security headers to all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}
