export const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Signed-in identity comes from the JWT, not storage: the stored refresh
// token only buys new pairs. Legacy accountId keys are ignored.
let access = null;

export const accountId = () => {
  try {
    const payload = JSON.parse(atob(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub || null;
  } catch {
    return null;
  }
};

export const setTokens = (a, r) => {
  access = a;
  if (r) localStorage.setItem('refresh', r);
  else localStorage.removeItem('refresh');
  localStorage.removeItem('accountId');
};

export function signOut(navigate) {
  const r = localStorage.getItem('refresh');
  if (r) {
    fetch(`${API}/auth/logout`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: r }),
    }).catch(() => {});
  }
  setTokens(null, null);
  localStorage.removeItem('mode');
  sessionStorage.removeItem('pendingChat');
  if (navigate) navigate('/');
}

// Branded sign-in backdrop: pastel pair for light, navy/orbital for dark,
// fitted to show the full art top and bottom.
export function bgForSite() {
  const mode = localStorage.getItem('theme') || 'system';
  const dark = mode === 'dark'
    || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const wide = window.innerWidth > 640;
  return `/bg/${dark ? 'dark' : 'light'}-${wide ? 'desktop' : 'mobile'}.png`;
}

// Customer/business mode (ACC-3): server is source of truth, mirrored here.
export const getMode = () => localStorage.getItem('mode') || 'customer';

export async function setMode(mode) {
  const acc = await api('/me/mode', { method: 'PATCH', body: JSON.stringify({ mode }) });
  localStorage.setItem('mode', acc.lastMode);
  return acc;
}

// Appearance: system follows the device, otherwise pinned (mirrors the app).
export function initTheme() {
  const mode = localStorage.getItem('theme') || 'system';
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

export const authHeaders = () => ({
  'content-type': 'application/json',
  ...(access ? { authorization: `Bearer ${access}` } : {}),
});

async function raw(path, init) {
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

export async function api(path, init, retried = false) {
  let r = await raw(path, init);
  if (r.status === 401 && !retried && !path.startsWith('/auth/')) {
    if (await rotateOnce()) r = await raw(path, init);
  }
  if (r.status < 200 || r.status >= 300) {
    if (r.status === 401) throw new Error(`401 ${(r.body.error || 'sign in again').trim()} ${path}`);
    throw new Error(`${r.status} ${(r.body.error || '').trim()}`.trim());
  }
  return r.body;
}

// Singleflight rotation: parallel 401s share one trade instead of racing
// the single-use token (losers would 401 and look logged-out).
let rotating = null;
async function rotateOnce() {
  if (!rotating) {
    rotating = (async () => {
      try {
        const saved = localStorage.getItem('refresh');
        if (!saved) return false;
        const rot = await raw('/auth/refresh', {
          method: 'POST', body: JSON.stringify({ refreshToken: saved }),
        });
        if (rot.status === 200 && rot.body.token) {
          setTokens(rot.body.token, rot.body.refreshToken);
          return true;
        }
      } catch { /* network blip — keep the saved refresh */ }
      return false;
    })().finally(() => { rotating = null; });
  }
  return rotating;
}

// Loop health (ANA-4): fire-and-forget, guests included (server allows
// anonymous events with rate limits).
export const recordEvent = (name, props) =>
  api('/events', {
    method: 'POST', body: JSON.stringify({ name, props: props || {} }),
  }).catch(() => {});

// Launch restore: trade the saved refresh token for a live session.
// Only a 401 means the token is truly dead — network blips and 5xx must
// NEVER wipe the saved refresh (every redeploy would log everyone out).
export async function restoreSession() {
  const saved = localStorage.getItem('refresh');
  if (!saved) return null;
  let r;
  try {
    r = await raw('/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken: saved }),
    });
  } catch {
    return null;
  }
  if (r.status === 200 && r.body.token) {
    setTokens(r.body.token, r.body.refreshToken);
    return r.body.account;
  }
  if (r.status === 401) setTokens(null, null);
  return null;
}

// Open (or reuse) a thread, then go to it. Signed-out visitors are sent
// through /auth first; the pending chat resumes afterwards (CHT-4).
export async function startThread(navigate, businessId, listingId) {
  if (!accountId()) {
    sessionStorage.setItem('pendingChat', JSON.stringify({ businessId, listingId: listingId || null }));
    navigate('/auth?next=/chat');
    return;
  }
  const t = await api('/threads', {
    method: 'POST',
    body: JSON.stringify({ businessId, ...(listingId ? { listingId } : {}) }),
  });
  recordEvent('chat_started', { businessId, ...(listingId ? { listingId } : {}) });
  navigate(`/chat/${t.id}`);
}
