// Step 2: email/phone OTP + country + mode switch (ACC-1..ACC-8)
// Local: OTP logged to console + GET /dev/otp. Token = base64(accountId) stub (JWT in beta).
import { sendMail } from './mail.js';

const codes = new Map(); // to -> { code, expires, attempts }
const hits = new Map(); // ip -> timestamps (ACC-6 rate limit)

function rateLimited(ip, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > limit;
}

export function authRoutes(app, prisma) {
  app.post('/auth/request-code', async (req, reply) => {
    const ip = req.ip;
    if (rateLimited(ip)) return reply.code(429).send({ error: 'too many requests' });
    const { email, phone } = req.body || {};
    const to = email || phone;
    if (!to) return reply.code(400).send({ error: 'email or phone required' });
    if (email && /@(mailinator|tempmail|10minutemail)/.test(email)) {
      return reply.code(400).send({ error: 'disposable email blocked (ACC-6)' });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    codes.set(to, { code, expires: Date.now() + 10 * 60_000 });
    console.log(`[otp] ${to} = ${code}`);
    if (email) await sendMail({ to: email, subject: 'Your New Era code', html: `<p>Code: <b>${code}</b></p>` });
    return { sent: true, devCode: process.env.OTP_MODE === 'console' ? code : undefined };
  });

  app.get('/dev/otp', async (req) => {
    const to = req.query.to;
    return { to, ...(codes.get(to) || {}) };
  });

  app.post('/auth/verify', async (req, reply) => {
    const { email, phone, code, country } = req.body || {};
    const to = email || phone;
    const rec = codes.get(to);
    if (!rec || rec.code !== code || Date.now() > rec.expires) {
      return reply.code(400).send({ error: 'invalid or expired code' });
    }
    codes.delete(to);
    // explicit country, never inferred from email (ACC-2)
    const account = await prisma.account.upsert({
      where: email ? { email } : { phone },
      update: {},
      create: { email, phone, country: country || 'NG' },
    });
    const token = Buffer.from(account.id).toString('base64');
    return { token, account };
  });

  const me = async (req, reply) => {
    const id = req.headers['x-account-id'];
    if (!id) return reply.code(401).send({ error: 'x-account-id required (stub auth)' });
    return prisma.account.findUnique({ where: { id } });
  };

  app.get('/me', async (req, reply) => me(req, reply));

  app.patch('/me/country', async (req, reply) => {
    const acc = await me(req, reply);
    if (!acc?.id) return acc;
    return prisma.account.update({
      where: { id: acc.id },
      data: { country: req.body.country },
    });
  });

  app.patch('/me/mode', async (req, reply) => {
    const acc = await me(req, reply);
    if (!acc?.id) return acc;
    return prisma.account.update({
      where: { id: acc.id },
      data: { lastMode: req.body.mode }, // customer|business, remembers last (ACC-3)
    });
  });
}
