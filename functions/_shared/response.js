// ========================================
// JSON Response Helpers
// Used by all API endpoints
// ========================================

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export function redirect(url, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url,
      ...headers
    }
  });
}

export function html(content, status = 200, headers = {}) {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...headers
    }
  });
}
