// Typed API client. Build env (EXPO_PUBLIC_*) wins for deploys;
// app.json extra is the local-dev fallback (LAN IP for real devices,
// 10.0.2.2 = host localhost from the Android emulator).
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra as { apiUrl?: string; siteUrl?: string } | undefined) ?? {};

// Production API (Railway). Public web builds fall back to this when the
// baked-in URL is a LAN/private address that can never work over the
// internet (Pages exports bake app.json's LAN IP unless EXPO_PUBLIC_API_URL
// is set in the dashboard). Local web (localhost/LAN host) and native
// (Expo Go) keep the configured URL untouched.
const PROD_API_URL = 'https://newera-production-59dc.up.railway.app';
const isPrivateHost = (h: string) =>
  h === 'localhost' || h === '127.0.0.1' || h === '[::1]' ||
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
const isPrivateUrl = (u: string) => {
  try {
    return isPrivateHost(new URL(u).hostname);
  } catch {
    return /localhost|127\.0\.0\.1/.test(u);
  }
};
const webHost = Platform.OS === 'web'
  ? (globalThis as { location?: { hostname?: string } }).location?.hostname ?? ''
  : '';
const needsProdFallback = Platform.OS === 'web' && webHost !== '' && !isPrivateHost(webHost) &&
  (!extra.apiUrl || isPrivateUrl(extra.apiUrl));

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (needsProdFallback ? PROD_API_URL : extra.apiUrl) || 'http://10.0.2.2:4000';

// Public storefront links (QR + share). Point at the live site in prod.
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL || extra.siteUrl || 'https://newera.shop';

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
  deactivatedAt: string | null;
};
export type Business = {
  id: string; ownerId: string; name: string; slug: string; category: string;
  country: string; city: string; area: string | null; deliveryArea: string | null;
  logoKey: string | null; coverKey: string | null; bio: string | null;
  matchedListings?: string[];
  previewPhotos?: string[];
};
export type Listing = {
  id: string; businessId: string; type: 'product' | 'service';
  title: string; price: string | null; currency: string;
  description: string | null; hidden?: boolean;
  availability: 'in_stock' | 'limited' | 'sold_out' | 'made_to_order';
  photos: string[];
};
export type Status = {
  id: string; businessId: string; kind: 'photo' | 'text';
  imageKey: string | null; text: string | null; bg: string | null;
  caption: string | null; expiresAt: string; createdAt: string;
};
export type FeedStatus = Status & {
  business: { id: string; name: string; slug: string; logoKey: string | null };
};
export type Certificate = {
  id: string; title: string; issuer: string | null; year: number | null; photo: string;
};
export type Thread = { id: string; businessId: string; customerId: string; listingId: string | null };
export type Peer =
  | { kind: 'business'; name: string; online: boolean; slug: string; logoKey: string | null }
  | { kind: 'customer'; name: string; online: boolean; accountId: string; avatarKey: string | null; tagline: string | null; contact: string | null };
export type MyThread = Thread & {
  business: { id: string; name: string; slug: string; logoKey: string | null };
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
  if (r.status === 401 && !retried && !path.startsWith('/auth/')) {
    if (await rotateOnce()) r = await raw<T>(path, init);
  }
  if (r.status === 401) throw new Error(`401 ${(r.body as { error?: string }).error || 'sign in again'} ${path}`);
  if (r.status < 200 || r.status >= 300) {
    const detail = (r.body as { error?: string }).error ?? '';
    throw new Error(`${r.status}${detail ? ' ' + detail : ''} ${path}`);
  }
  return r.body;
}

// Singleflight rotation: parallel 401s share one trade instead of racing
// the single-use token (losers would 401 and look logged-out).
let rotating: Promise<boolean> | null = null;
async function rotateOnce(): Promise<boolean> {
  if (!rotating) {
    rotating = (async () => {
      try {
        if (!refresh) return false;
        const rot = await raw<{ token: string; refreshToken: string; account: Account }>(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) },
        );
        if (rot.status === 200 && rot.body.token) {
          await setTokens(rot.body.token, rot.body.refreshToken);
          return true;
        }
      } catch { /* network blip — keep the saved refresh */ }
      return false;
    })().finally(() => { rotating = null; });
  }
  return rotating;
}

// Saved refresh token for launch restore (null when signed out).
export const loadRefresh = async () => {
  refresh = await getFlag('refresh');
  return refresh;
};

// Trade the saved refresh token for a live pair. Null when it's dead.
// Only a 401 clears the saved token — network blips and 5xx keep it, so a
// reload during a redeploy never logs the user out.
export const refreshSession = async (): Promise<{ token: string; refreshToken: string; account: Account } | null> => {
  if (!refresh) return null;
  let r;
  try {
    r = await raw<{ token: string; refreshToken: string; account: Account }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) },
    );
  } catch {
    return null;
  }
  if (r.status === 200 && r.body.token) {
    await setTokens(r.body.token, r.body.refreshToken);
    return r.body;
  }
  if (r.status === 401) await setTokens(null, null);
  return null;
};

/** Currency symbol for the business's own currency (PRD §7, never converted). */
export const symFor = (c: string) => ({ NGN: '₦', GHS: 'GH₵', KES: 'KSh' } as Record<string, string>)[c] ?? '';

/** Resolve a stored photo key to a loadable URL (R2 public URL or local /img). */
export const img = (key: string) => (/^https?:\/\//.test(key) ? key : `${API_URL}/img/${key}`);

export const api = {
  status: () => req<{ maintenance: boolean; message: string; minAppVersion?: string }>('/status'),
  requestCode: (body: { email?: string; phone?: string }) =>
    req<{ sent: boolean; devCode?: string }>('/auth/request-code', { method: 'POST', body: JSON.stringify(body) }),
  checkAccount: (email: string) =>
    req<{ exists: boolean }>('/auth/check', { method: 'POST', body: JSON.stringify({ email }) }),
  deactivate: () =>
    req<{ ok: boolean }>('/me/deactivate', { method: 'POST' }),
  reactivate: () =>
    req<{ ok: boolean; account?: Account }>('/me/reactivate', { method: 'POST' }),
  deleteAccount: () =>
    req<{ ok: boolean }>('/me/account', { method: 'DELETE' }),
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
  updates: () => req<FeedStatus[]>('/updates'),
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
