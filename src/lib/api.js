// Base URL of the backend.
// In dev, Vite proxies /api to the backend, so API_BASE stays empty.
// In production, prefer VITE_API_BASE_URL (set via .env.production locally,
// or the VITE_API_BASE_URL repo secret in the GitHub Actions build) and
// fall back to the known deployed worker if it isn't set.
const API_BASE = import.meta.env.MODE === 'development'
  ? ''
  : import.meta.env.VITE_API_BASE_URL || 'https://client-service-backend.faresayadi055.workers.dev';

/**
 * Fetches existing chat messages for a session.
 * Backend route: GET /api/chat/:sessionId
 */
export async function fetchChatHistory(sessionId) {
  const res = await fetch(`${API_BASE}/api/chat/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch chat history (${res.status})`);
  }
  const data = await res.json();
  return data.messages;
}

/**
 * Sends a message to the AI spokesperson endpoint with streaming.
 * Backend route: POST /api/chat (returns SSE)
 * Calls onChunk(text) for each streamed text fragment and onDone() when complete.
 */
export async function sendChatMessage(sessionId, messages, { onChunk, onDone } = {}) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI request failed (${res.status})`);
  }

  if (!onChunk) {
    const text = await res.text();
    return { reply: text };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullReply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      try {
        const data = JSON.parse(jsonStr);
        if (data.error) throw new Error(data.error);
        if (data.text) {
          fullReply += data.text;
          onChunk(data.text);
        }
      } catch {}
    }
  }

  onDone?.(fullReply);
  return { reply: fullReply };
}

/**
 * Reports a lightweight, anonymous web traffic event.
 * Backend route: POST /api/analytics
 */
export async function trackEvent(event) {
  if (localStorage.getItem('ADMIN_ACCESS_TOKEN')) return;
  try {
    await fetch(`${API_BASE}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        path: window.location.pathname,
        referrer: document.referrer || null,
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch {
    // Analytics failures should never break the UI.
  }
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('ADMIN_ACCESS_TOKEN') || ''}`,
  };
}

// Wraps fetch so callers can tell "server said no" (401) apart from
// network/CORS failures, which are not the same thing as a bad token.
async function adminFetch(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    const networkErr = new Error('Network error while contacting the server.');
    networkErr.isNetworkError = true;
    networkErr.cause = err;
    throw networkErr;
  }
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`);
    err.status = res.status;
    err.isUnauthorized = res.status === 401;
    throw err;
  }
  return res.json();
}

export async function fetchAdminAnalytics() {
  return adminFetch(`${API_BASE}/admin/api/analytics`, { headers: adminHeaders() });
}

export async function fetchAdminChatSessions() {
  return adminFetch(`${API_BASE}/admin/api/chat-sessions`, { headers: adminHeaders() });
}

export async function fetchAdminChatSession(sessionId) {
  return adminFetch(`${API_BASE}/admin/api/chat/${sessionId}`, { headers: adminHeaders() });
}

export async function deleteAdminChatSession(sessionId) {
  return adminFetch(`${API_BASE}/admin/api/chat/${sessionId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

export async function fetchSetting(key) {
  return adminFetch(`${API_BASE}/admin/api/settings/${key}`, { headers: adminHeaders() });
}

export async function updateSetting(key, value) {
  return adminFetch(`${API_BASE}/admin/api/settings/${key}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ value }),
  });
}
