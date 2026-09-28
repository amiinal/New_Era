import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getPresignedPut, publicUrlFor } from './r2.js';
import { sendMail } from './mail.js';
import { authRoutes } from './auth.js';
import { storeRoutes } from './store.js';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.get('/health', async () => ({ ok: true, stack: 'fastify+pg+r2' }));
authRoutes(app, prisma);
storeRoutes(app, prisma);

// Step 4 stub: presigned upload to R2 (app uploads direct)
app.post('/uploads/presign', async (req) => {
  const { key, contentType } = req.body || {};
  if (!key) return { error: 'key required, e.g. business/123/listing/456/feed.jpg' };
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
