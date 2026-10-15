import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getPresignedPut, publicUrlFor } from './r2.js';
import { sendMail } from './mail.js';
import { authRoutes } from './auth.js';
import { storeRoutes } from './store.js';
import { adminRoutes } from './admin.js';
import { capture, initSentry } from './sentry.js';

initSentry();
process.on('unhandledRejection', (e) => capture(e));
process.on('uncaughtException', (e) => capture(e));

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 10 * 1024 * 1024 });
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.get('/health', async () => ({ ok: true, stack: 'fastify+pg+r2' }));

// Every 500 + route throw lands in Sentry Issues.
app.addHook('onError', async (req, reply, error) => {
  capture(error);
});

// Browser calls (Vite :5173) need CORS. No plugin — plain headers.
app.addHook('onRequest', (req, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Headers', 'content-type, authorization');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return reply.code(204).send();
  done();
});
authRoutes(app, prisma);
storeRoutes(app, prisma);
adminRoutes(app, prisma);

// Photo URLs: R2 keys need absolute public URLs, but only when R2 public
// serving actually resolves (else inline/disk photos would break). Probed
// once at boot; uploads/* always stays local (/img on the API host).
let r2Direct = false;
let r2Base = '';
let r2LastProbe = 0;
async function probeR2(log) {
  r2LastProbe = Date.now();
  try {
    // Tolerant: bare hostnames and stray whitespace still resolve.
    const raw = String(process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
    if (!raw) throw new Error('no R2_PUBLIC_URL');
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    // Stronger than DNS: fetch the bucket's own healthcheck file, which
    // proves serving (DNS + HTTP + bucket) end to end.
    const res = await fetch(`${withScheme}/__healthcheck.txt`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`R2 healthcheck ${res.status}`);
    r2Base = withScheme;
    if (!r2Direct && log) console.log(`[img] R2 public serving live at ${withScheme}`);
    r2Direct = true;
  } catch {
    if (r2Direct && log) console.log('[img] R2 public host lost — serving photo keys relative (/img)');
    r2Direct = false;
    r2Base = '';
  }
}
// Boot probe plus a slow self-heal: a transient DNS miss at boot must not
// pin relative URLs forever.
await probeR2(true);
setInterval(() => { probeR2(false).catch(() => {}); }, 60_000);
const PHOTO_KEYS = new Set(['logoKey', 'coverKey', 'headerKey', 'avatarKey', 'photo', 'imageKey', 'photos']);
const fixPhoto = (v) => {
  if (typeof v !== 'string' || !v) return v;
  if (/^https?:\/\//.test(v) || v.startsWith('uploads/')) return v;
  if (r2Direct && r2Base) return `${r2Base}/${v}`;
  return v;
};
const fixPhotos = (v) => {
  if (Array.isArray(v)) return v.map(fixPhotos);
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      v[k] = PHOTO_KEYS.has(k)
        ? (Array.isArray(v[k]) ? v[k].map(fixPhoto) : fixPhoto(v[k]))
        : fixPhotos(v[k]);
    }
  }
  return v;
};
app.addHook('onSend', async (req, reply, payload) => {
  if (typeof payload !== 'string' || !String(reply.getHeader('content-type') || '').includes('application/json')) {
    return payload;
  }
  try {
    return JSON.stringify(fixPhotos(JSON.parse(payload)));
  } catch {
    return payload;
  }
});

// Kill switch: when maintenance is on, writes pause (reads stay up).
// /admin/* stays open so the team can switch it back off.
app.addHook('onRequest', async (req, reply) => {
  if (req.method === 'GET' || req.url === '/health' || req.url === '/status' || req.url.startsWith('/admin/')) return;
  const flag = await prisma.serverConfig.findUnique({ where: { key: 'maintenance_on' } }).catch(() => null);
  if (flag?.value === '1') return reply.code(503).send({ error: 'paused for maintenance — back soon' });
});

// Public status for the app + web gates.
app.get('/status', async () => {
  const [on, message, minApp] = await Promise.all([
    prisma.serverConfig.findUnique({ where: { key: 'maintenance_on' } }).catch(() => null),
    prisma.serverConfig.findUnique({ where: { key: 'maintenance_message' } }).catch(() => null),
    prisma.serverConfig.findUnique({ where: { key: 'min_app_version' } }).catch(() => null),
  ]);
  return { maintenance: on?.value === '1', message: message?.value || '', minAppVersion: minApp?.value || '' };
});

// Step 4 stub: presigned upload to R2 (app uploads direct). Authed, and the
// key is fenced to our upload namespaces — open presigning would let anyone
// store (or overwrite) arbitrary objects in the bucket.
app.post('/uploads/presign', async (req, reply) => {
  const { bearer, verifyAccess } = await import('./token.js');
  const sub = verifyAccess(bearer(req));
  if (!sub) return reply.code(401).send({ error: 'sign in again' });
  const { key, contentType } = req.body || {};
  const clean = String(key || '').replace(/\\/g, '/');
  if (!clean || clean.includes('..') || clean.length > 160 ||
    !/^(business|support|account|chat)\//.test(clean)) {
    return reply.code(400).send({ error: 'key must start with business/, support/, account/, or chat/' });
  }
  const type = ['image/jpeg', 'image/png', 'image/webp'].includes(contentType) ? contentType : 'image/jpeg';
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    return reply.code(400).send({ error: 'R2 not configured — use /uploads/inline' });
  }
  const url = await getPresignedPut(clean, type);
  return { uploadUrl: url, publicUrl: publicUrlFor(clean) };
});

// Local-dev only (same flag as /dev/otp): open mail relay in production
// would let anyone send phishing from our domain.
if (process.env.ENABLE_DEV_ROUTES === '1') {
  // Step 2/6 stub: mail via Resend/ZeptoMail/console
  app.post('/dev/send-test-mail', async (req) => {
    const { to } = req.body || {};
    await sendMail({ to: to || 'test@example.com', subject: 'New Era test', html: '<p>Hello from Step 0</p>' });
    return { sent: true, provider: process.env.EMAIL_PROVIDER || 'console' };
  });
}

app.listen({ port: PORT, host: '0.0.0.0' });
