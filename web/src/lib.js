export const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const accountId = () => localStorage.getItem('accountId');

export function signOut(navigate) {
  localStorage.removeItem('accountId');
  localStorage.removeItem('mode');
  if (navigate) navigate('/');
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
  ...(accountId() ? { 'x-account-id': accountId() } : {}),
});

export async function api(path, init) {
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${(j.error || '').trim()}`.trim());
  return j;
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
  navigate(`/chat/${t.id}`);
}
