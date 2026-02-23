// ========================================
// Auth Utilities
// Session verification, token generation
// Used by _middleware.js and auth endpoints
// ========================================

/**
 * Look up a user from their session token.
 * Returns user object { id, email, display_name, is_admin } or null.
 */
export async function getUserFromSession(db, sessionToken) {
  if (!sessionToken) return null;

  const result = await db.prepare(`
    SELECT u.id, u.email, u.display_name, u.is_admin
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).bind(sessionToken).first();

  return result || null;
}

/**
 * Generate a cryptographically secure random hex token.
 * Default 64 characters (32 bytes).
 */
export function generateToken(length = 64) {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse a named cookie from the Cookie header string.
 * Returns the cookie value or null.
 */
export function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

/**
 * Build a Set-Cookie header string for the session cookie.
 */
export function buildSessionCookie(token, maxAge = 2592000) {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

/**
 * Build a Set-Cookie header string that clears the session cookie.
 */
export function clearSessionCookie() {
  return 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

/**
 * Validate email format. Returns true if valid.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Escape HTML entities to prevent XSS.
 * Used on all user-provided content (comments, display names).
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
