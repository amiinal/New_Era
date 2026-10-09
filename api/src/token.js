// Minimal HS256 JWT (no new deps): short access tokens + opaque
// refresh tokens whose sha256 lives in the DB for rotation + revocation.
import crypto from 'node:crypto';

const ACCESS_SEC = 15 * 60;
const REFRESH_SEC = 30 * 24 * 3600;

function secret() {
  if (!process.env.JWT_SECRET) {
    console.warn('[auth] JWT_SECRET unset — using an ephemeral secret (sessions die on restart)');
    if (!globalThis.__jwtEphemeral) globalThis.__jwtEphemeral = crypto.randomBytes(32).toString('hex');
    return globalThis.__jwtEphemeral;
  }
  return process.env.JWT_SECRET;
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

export function signAccess(accountId) {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const p = b64({ sub: accountId, iat: now, exp: now + ACCESS_SEC });
  const sig = crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

export function verifyAccess(token) {
  const [h, p, sig] = String(token || '').split('.');
  if (!h || !p || !sig) return null;
  let header;
  try { header = JSON.parse(Buffer.from(h, 'base64url').toString()); } catch { return null; }
  if (header.alg !== 'HS256') return null; // alg locked — no confusion attacks
  let expect;
  try {
    expect = crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest('base64url');
  } catch { return null; }
  const a = Buffer.from(expect);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let body;
  try { body = JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
  if (!body.sub || !body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
  return body.sub;
}

export function mintRefresh() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export const refreshHash = (raw) =>
  crypto.createHash('sha256').update(String(raw)).digest('hex');

export const REFRESH_MS = REFRESH_SEC * 1000;

export function bearer(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer (.+)$/.exec(h.trim());
  return m ? m[1] : null;
}
