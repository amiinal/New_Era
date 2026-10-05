import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getPresignedPut, publicUrlFor } from './r2.js';
import { sendMail } from './mail.js';
import { authRoutes } from './auth.js';
import { storeRoutes } from './store.js';
import { adminRoutes } from './admin.js';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.get('/health', async () => ({ ok: true, stack: 'fastify+pg+r2' }));

// Browser calls (Vite :5173) need CORS. No plugin — plain headers.
app.addHook('onRequest', (req, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Headers', 'content-type, x-account-id');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return reply.code(204).send();
  done();
});
authRoutes(app, prisma);
storeRoutes(app, prisma);
adminRoutes(app, prisma);

// Kill switch: when maintenance is on, writes pause (reads stay up).
// /admin/* stays open so the team can switch it back off.
app.addHook('onRequest', async (req, reply) => {
  if (req.method === 'GET' || req.url === '/health' || req.url === '/status' || req.url.startsWith('/admin/')) return;
  const flag = await prisma.serverConfig.findUnique({ where: { key: 'maintenance_on' } }).catch(() => null);
  if (flag?.value === '1') return reply.code(503).send({ error: 'paused for maintenance — back soon' });
});

// Public status for the app + web gates.
app.get('/status', async () => {
  const [on, message] = await Promise.all([
    prisma.serverConfig.findUnique({ where: { key: 'maintenance_on' } }).catch(() => null),
    prisma.serverConfig.findUnique({ where: { key: 'maintenance_message' } }).catch(() => null),
  ]);
  return { maintenance: on?.value === '1', message: message?.value || '' };
});

// Step 4 stub: presigned upload to R2 (app uploads direct)
app.post('/uploads/presign', async (req, reply) => {
  const { key, contentType } = req.body || {};
  if (!key) return { error: 'key required, e.g. business/123/listing/456/feed.jpg' };
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    return reply.code(400).send({ error: 'R2 not configured — use /uploads/inline' });
  }
  const url = await getPresignedPut(key, contentType || 'image/jpeg');
  return { uploadUrl: url, publicUrl: publicUrlFor(key) };
});

// Step 2/6 stub: mail via Resend/ZeptoMail/console
app.post('/dev/send-test-mail', async (req) => {
  const { to } = req.body || {};
  await sendMail({ to: to || 'test@example.com', subject: 'New Era test', html: '<p>Hello from Step 0</p>' });
  return { sent: true, provider: process.env.EMAIL_PROVIDER || 'console' };
});

app.listen({ port: PORT, host: '0.0.0.0' });
