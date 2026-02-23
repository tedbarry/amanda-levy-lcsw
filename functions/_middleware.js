// ========================================
// Cloudflare Pages Functions Middleware
// Runs before every API request
//
// Responsibilities:
// 1. Parse session cookie and attach user to context
// 2. CSRF origin checking for state-changing requests
// 3. Add security headers to all responses
// ========================================

import { getUserFromSession, parseCookie } from './_shared/auth.js';

const ALLOWED_ORIGINS = [
  'https://amandalevylcsw.com',
  'https://www.amandalevylcsw.com',
];

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

  // CSRF origin checking for state-changing methods
  const method = context.request.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = context.request.headers.get('Origin');
    const referer = context.request.headers.get('Referer');
    const checkValue = origin || (referer ? new URL(referer).origin : null);

    if (checkValue) {
      const isAllowed = ALLOWED_ORIGINS.includes(checkValue) ||
        checkValue.startsWith('http://localhost') ||
        checkValue.startsWith('http://127.0.0.1');

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Forbidden: invalid origin.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    // If neither Origin nor Referer is present, allow the request
    // (some legitimate clients may not send these headers)
  }

  // Continue to the actual handler
  const response = await context.next();

  // Add security headers to all API responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}
