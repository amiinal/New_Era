// Typed API client. Base URL comes from app.json extra (10.0.2.2 = host
// localhost from the Android emulator; use your LAN IP on a real device).
import Constants from 'expo-constants';

export const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://10.0.2.2:4000';

// Public storefront links (QR + share). Overridable per build.
export const SITE_URL =
  (Constants.expoConfig?.extra as { siteUrl?: string } | undefined)?.siteUrl ??
  'https://newera.shop';

export type Account = {
  id: string; email: string | null; phone: string | null;
  country: string; lastMode: 'customer' | 'business';
  avatarKey: string | null; tagline: string | null; headerKey: string | null;
  displayName: string | null;
  showEmail: boolean;
  showPhone: boolean;
  contactPhone: string | null;
  showContactPhone: boolean;
  hasPassword: boolean;
};
export type Business = {
  id: string; ownerId: string; name: string; slug: string; category: string;
  country: string; city: string; area: string | null; deliveryArea: string | null;
  logoKey: string | null; coverKey: string | null; bio: string | null;
  matchedListings?: string[];
};
export type Listing = {
  id: string; businessId: string; type: 'product' | 'service';
  title: string; price: string | null; currency: string;
  description: string | null;
  availability: 'in_stock' | 'limited' | 'sold_out' | 'made_to_order';
  photos: string[];
};
export type Status = {
  id: string; businessId: string; kind: 'photo' | 'text';
  imageKey: string | null; text: string | null; bg: string | null;
  caption: string | null; expiresAt: string; createdAt: string;
};
export type Certificate = {
  id: string; title: string; issuer: string | null; year: number | null; photo: string;
};
export type Thread = { id: string; businessId: string; customerId: string; listingId: string | null };
export type Peer =
  | { kind: 'business'; name: string; online: boolean; slug: string; logoKey: string | null }
  | { kind: 'customer'; name: string; online: boolean; accountId: string; avatarKey: string | null; tagline: string | null; contact: string | null };
export type MyThread = Thread & {
  business: { id: string; name: string; slug: string };
  messages: Message[]; unread: number; online: boolean;
};
export type Message = {
  id: string; threadId: string; senderId: string;
  body: string | null; imageKey: string | null; createdAt: string;
};
export type Storefront = {
  business: Business;
  listings: Listing[];
  collections: { id: string; name: string }[];
  statuses: Status[];
  certificates: Certificate[];
};

import { delFlag, getFlag, setFlag } from './store';

// JWT access (15min, memory) + refresh (30d, persisted). Expired access
// is silently rotated once per call; a dead refresh means sign in again.
let access: string | null = null;
let refresh: string | null = null;

export const setTokens = async (a: string | null, r: string | null) => {
  access = a;
  refresh = r;
  if (r) await setFlag('refresh', r);
  else await delFlag('refresh');
};
export const getRefresh = () => refresh;

async function raw<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(access ? { authorization: `Bearer ${access}` } : {}),
      ...init?.headers,
    },
  });
  let body = {} as T;
  try { body = await res.json() as T; } catch { /* non-JSON */ }
  return { status: res.status, body };
}

async function req<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  let r = await raw<T>(path, init);
  if (r.status === 401 && !retried && refresh && !path.startsWith('/auth/')) {
    try {
      const rot = await raw<{ token: string; refreshToken: string; account: Account }>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) },
      );
      if (rot.status === 200 && rot.body.token) {
        await setTokens(rot.body.token, rot.body.refreshToken);
        r = await raw<T>(path, init);
      }
    } catch { /* fall through to the 401 below */ }
  }
  if (r.status === 401) throw new Error(`401 ${(r.body as { error?: string }).error || 'sign in again'} ${path}`);
  if (r.status < 200 || r.status >= 300) {
    const detail = (r.body as { error?: string }).error ?? '';
    throw new Error(`${r.status}${detail ? ' ' + detail : ''} ${path}`);
  }
  return r.body;
}

// Saved refresh token for launch restore (null when signed out).
export const loadRefresh = async () => {
  refresh = await getFlag('refresh');
  return refresh;
};

// Trade the saved refresh token for a live pair. Null when it's dead.
export const refreshSession = async (): Promise<{ token: string; refreshToken: string; account: Account } | null> => {
  if (!refresh) return null;
  try {
    const r = await raw<{ token: string; refreshToken: string; account: Account }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) },
    );
    if (r.status === 200 && r.body.token) {
      await setTokens(r.body.token, r.body.refreshToken);
      return r.body;
    }
  } catch { /* dead — sign in again */ }
  await setTokens(null, null);
  return null;
};

/** Currency symbol for the business's own currency (PRD §7, never converted). */
export const symFor = (c: string) => ({ NGN: '₦', GHS: 'GH₵', KES: 'KSh' } as Record<string, string>)[c] ?? '';

/** Resolve a stored photo key to a loadable URL (R2 public URL or local /img). */
export const img = (key: string) => (/^https?:\/\//.test(key) ? key : `${API_URL}/img/${key}`);

export const api = {
  status: () => req<{ maintenance: boolean; message: string }>('/status'),
  requestCode: (body: { email?: string; phone?: string }) =>
    req<{ sent: boolean; devCode?: string }>('/auth/request-code', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: { email?: string; phone?: string; code: string; country: string }) =>
    req<{ token: string; refreshToken: string; account: Account } | { needsPassword: true; accountId: string }>('/auth/verify', { method: 'POST', body: JSON.stringify(body) }),
  passwordLogin: (body: { accountId: string; password: string }) =>
    req<{ token: string; refreshToken: string; account: Account }>('/auth/password', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body: { email?: string; phone?: string }) =>
    req<{ sent: boolean; devCode?: string }>('/auth/password/forgot', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: { email?: string; phone?: string; code: string; password: string }) =>
    req<{ token: string; refreshToken: string; account: Account }>('/auth/password/reset', { method: 'POST', body: JSON.stringify(body) }),
  setPassword: (body: { password: string; current?: string }) =>
    req<{ ok: boolean; account: Account; token: string; refreshToken: string }>('/me/password', { method: 'POST', body: JSON.stringify(body) }),
  logout: (refreshToken: string | null) =>
    req<{ ok: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => ({ ok: false })),
  requestEmailChange: (email: string) =>
    req<{ sent: boolean; devCode?: string }>('/me/email/request', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmEmailChange: (body: { email: string; code: string }) =>
    req<Account>('/me/email/confirm', { method: 'POST', body: JSON.stringify(body) }),
  requestPhoneChange: (phone: string) =>
    req<{ sent: boolean; devCode?: string }>('/me/phone/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  confirmPhoneChange: (body: { phone: string; code: string }) =>
    req<Account>('/me/phone/confirm', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req<Account>('/me'),
  saveProfile: (body: { avatarKey?: string; tagline?: string; headerKey?: string; displayName?: string | null; showEmail?: boolean; showPhone?: boolean; contactPhone?: string | null; showContactPhone?: boolean }) =>
    req<Account>('/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  patchBusiness: (id: string, body: { coverKey?: string; logoKey?: string; bio?: string; area?: string; deliveryArea?: string }) =>
    req<Business>(`/businesses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  discover: (q: { country: string; city?: string; q?: string; category?: string }) =>
    req<Business[]>(`/discover?${new URLSearchParams(q as Record<string, string>)}`),
  storefront: (slug: string) => req<Storefront>(`/storefront/${slug}`),
  listing: (id: string) => req<Listing>(`/listings/${id}`),
  openThread: (businessId: string, listingId?: string) =>
    req<Thread>('/threads', { method: 'POST', body: JSON.stringify({ businessId, listingId }) }),
  thread: (threadId: string) =>
    req<{ thread: Thread; peer: Peer }>(`/threads/${threadId}`),
  myThreads: () => req<MyThread[]>('/me/threads'),
  messages: (threadId: string) => req<Message[]>(`/threads/${threadId}/messages`),
  sendMessage: (threadId: string, body: { body?: string; imageKey?: string }) =>
    req<Message>(`/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  deleteMessage: (threadId: string, messageId: string) =>
    req<{ deleted: boolean }>(`/threads/${threadId}/messages/${messageId}`, { method: 'DELETE' }),
  deleteThread: (threadId: string) =>
    req<{ deleted: boolean }>(`/threads/${threadId}`, { method: 'DELETE' }),
  report: (body: { targetType: string; targetId: string; reason: string; contact?: string }) =>
    req<{ id: string }>('/reports', { method: 'POST', body: JSON.stringify(body) }),
  presign: (key: string) =>
    req<{ uploadUrl: string; publicUrl: string }>('/uploads/presign', {
      method: 'POST', body: JSON.stringify({ key, contentType: 'image/jpeg' }),
    }),
  inlineUpload: (name: string, base64: string) =>
    req<{ key: string }>('/uploads/inline', {
      method: 'POST', body: JSON.stringify({ name, data: base64 }),
    }),
  // Photo bytes → stored key. Prefers R2 direct PUT, falls back to local
  // inline storage (dev without R2 keys). Shared by statuses + listings.
  uploadPhoto: async (localUri: string, key: string): Promise<string> => {
    try {
      const { uploadUrl } = await api.presign(key);
      const blob = await (await fetch(localUri)).blob();
      const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      if (!put.ok) throw new Error('r2 put failed');
      return key;
    } catch {
      // RN's Blob has no arrayBuffer(): go through FileReader instead.
      const blob = await (await fetch(localUri)).blob();
      if (!blob.size || blob.size < 1024) throw new Error('empty photo — retry capture');
      const dataUrl: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(new Error('read failed'));
        fr.readAsDataURL(blob);
      });
      const base64 = (dataUrl.split(',')[1] || '');
      return (await api.inlineUpload(key.split('/').pop() || 'photo.jpg', base64)).key;
    }
  },
  bizListings: (businessId: string) => req<Listing[]>(`/businesses/${businessId}/listings`),
  createListing: (businessId: string, body: {
    type: 'product' | 'service'; title: string; price?: string; description?: string;
    availability?: Listing['availability']; photos: string[];
  }) => req<Listing>(`/businesses/${businessId}/listings`, { method: 'POST', body: JSON.stringify(body) }),
  patchListing: (id: string, body: Partial<Pick<Listing, 'title' | 'price' | 'availability' | 'photos' | 'description'>>) =>
    req<Listing>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteListing: (id: string) =>
    req<{ deleted: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
  myBusinesses: () => req<Business[]>('/me/businesses'),
  business: (id: string) => req<Business>(`/businesses/${id}`),
  createBusiness: (body: {
    name: string; category: string; country: string; city: string;
    area?: string; deliveryArea?: string; nationwide?: boolean; logoKey?: string; coverKey?: string;
  }) => req<Business>('/businesses', { method: 'POST', body: JSON.stringify(body) }),
  addCertificate: (businessId: string, body: { title: string; issuer?: string; year?: number; photo: string }) =>
    req<Certificate>(`/businesses/${businessId}/certificates`, { method: 'POST', body: JSON.stringify(body) }),
  recordEvent: (name: string, props?: Record<string, string>) =>
    req<{ id: string }>('/events', { method: 'POST', body: JSON.stringify({ name, props: props || {} }) }),
  insights: (businessId: string, range: 7 | 30) =>
    req<{ range: number; storefrontViews: number; chatsStarted: number; listings: number; activeStatuses: number }>(
      `/businesses/${businessId}/insights?range=${range}`),
  bizThreads: (businessId: string) =>
    req<(Thread & { messages: Message[]; unread: number; customer: {
      name: string; tagline: string | null; avatarKey: string | null; online: boolean; contact: string | null;
    } })[]>(`/businesses/${businessId}/threads`),
  setMode: (mode: 'customer' | 'business') =>
    req<Account>('/me/mode', { method: 'PATCH', body: JSON.stringify({ mode }) }),
  postStatus: (businessId: string, body: { kind: 'photo' | 'text'; imageKey?: string; text?: string; bg?: string; caption?: string }) =>
    req<Status>(`/businesses/${businessId}/statuses`, { method: 'POST', body: JSON.stringify(body) }),
  supportMine: () => req<SupportMsg[]>('/support/mine'),
  sendSupport: (body: string) =>
    req<SupportMsg>('/support/messages', { method: 'POST', body: JSON.stringify({ body }) }),
};

export type SupportMsg = {
  id: string; accountId: string; body: string;
  fromAdmin: boolean; read: boolean; createdAt: string;
};
