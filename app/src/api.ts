// Typed API client. Base URL comes from app.json extra (10.0.2.2 = host
// localhost from the Android emulator; use your LAN IP on a real device).
import Constants from 'expo-constants';

export const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://10.0.2.2:4000';

export type Account = {
  id: string; email: string | null; phone: string | null;
  country: string; lastMode: 'customer' | 'business';
};
export type Business = {
  id: string; name: string; slug: string; category: string;
  country: string; city: string; area: string | null; deliveryArea: string | null;
};
export type Listing = {
  id: string; businessId: string; type: 'product' | 'service';
  title: string; price: string | null; currency: string;
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

let accountId: string | null = null; // stub auth (Step 2); JWT before beta
export const setAccountId = (id: string | null) => { accountId = id; };

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(accountId ? { 'x-account-id': accountId } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

/** Resolve a stored photo key to a loadable URL (R2 public URL or local /img). */
export const img = (key: string) => (/^https?:\/\//.test(key) ? key : `${API_URL}/img/${key}`);

export const api = {
  requestCode: (body: { email?: string; phone?: string }) =>
    req<{ sent: boolean; devCode?: string }>('/auth/request-code', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: { email?: string; phone?: string; code: string; country: string }) =>
    req<{ token: string; account: Account }>('/auth/verify', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req<Account>('/me'),
  discover: (q: { country: string; city?: string; q?: string; category?: string }) =>
    req<Business[]>(`/discover?${new URLSearchParams(q as Record<string, string>)}`),
  storefront: (slug: string) => req<Storefront>(`/storefront/${slug}`),
  listing: (id: string) => req<Listing>(`/listings/${id}`),
  openThread: (businessId: string, listingId?: string) =>
    req<Thread>('/threads', { method: 'POST', body: JSON.stringify({ businessId, listingId }) }),
  messages: (threadId: string) => req<Message[]>(`/threads/${threadId}/messages`),
  sendMessage: (threadId: string, body: { body?: string; imageKey?: string }) =>
    req<Message>(`/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  report: (body: { targetType: string; targetId: string; reason: string }) =>
    req<{ id: string }>('/reports', { method: 'POST', body: JSON.stringify(body) }),
  presign: (key: string) =>
    req<{ uploadUrl: string; publicUrl: string }>('/uploads/presign', {
      method: 'POST', body: JSON.stringify({ key, contentType: 'image/jpeg' }),
    }),
  postStatus: (businessId: string, body: { kind: 'photo' | 'text'; imageKey?: string; text?: string; bg?: string; caption?: string }) =>
    req<Status>(`/businesses/${businessId}/statuses`, { method: 'POST', body: JSON.stringify(body) }),
};
