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
    type: 'product' | 'service'; title: string; price?: string;
    availability?: Listing['availability']; photos: string[];
  }) => req<Listing>(`/businesses/${businessId}/listings`, { method: 'POST', body: JSON.stringify(body) }),
  patchListing: (id: string, body: Partial<Pick<Listing, 'title' | 'price' | 'availability' | 'photos'>>) =>
    req<Listing>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteListing: (id: string) =>
    req<{ deleted: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
  myBusinesses: () => req<Business[]>('/me/businesses'),
  recordEvent: (name: string, props?: Record<string, string>) =>
    req<{ id: string }>('/events', { method: 'POST', body: JSON.stringify({ name, props: props || {} }) }),
  insights: (businessId: string, range: 7 | 30) =>
    req<{ range: number; storefrontViews: number; chatsStarted: number; listings: number; activeStatuses: number }>(
      `/businesses/${businessId}/insights?range=${range}`),
  bizThreads: (businessId: string) =>
    req<(Thread & { messages: Message[] })[]>(`/businesses/${businessId}/threads`),
  setMode: (mode: 'customer' | 'business') =>
    req<Account>('/me/mode', { method: 'PATCH', body: JSON.stringify({ mode }) }),
  postStatus: (businessId: string, body: { kind: 'photo' | 'text'; imageKey?: string; text?: string; bg?: string; caption?: string }) =>
    req<Status>(`/businesses/${businessId}/statuses`, { method: 'POST', body: JSON.stringify(body) }),
};
