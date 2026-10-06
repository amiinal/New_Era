// Step 2: email/phone OTP + country + mode switch (ACC-1..ACC-8)
// Optional password as 2nd step: OTP first, then password if set.
// Change of email/phone is verified by code to the NEW address.
// Local: OTP logged to console + GET /dev/otp. Token = base64(accountId) stub (JWT in beta).
import crypto from 'node:crypto';
import { sendMail } from './mail.js';

const codes = new Map(); // key -> { code, expires }
const hits = new Map(); // ip -> timestamps (ACC-6 rate limit)

function rateLimited(ip, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > limit;
}

function norm(email, phone) {
  if (email) return String(email).trim().toLowerCase();
  if (phone) return String(phone).trim().replace(/[\s-]/g, '');
  return null;
}

const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

// Never leak the hash to clients.
function safe(acc) {
  if (!acc || typeof acc !== 'object') return acc;
  const { passwordHash, ...rest } = acc;
  return { ...rest, hasPassword: !!passwordHash };
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function checkPassword(pw, stored) {
  try {
    const [kind, salt, hash] = String(stored).split('$');
    if (kind !== 'scrypt' || !salt || !hash) return false;
    const h = crypto.scryptSync(String(pw), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

async function sendCode(key, { email } = {}) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(key, { code, expires: Date.now() + 10 * 60_000 });
  console.log(`[otp] ${key} = ${code}`);
  if (email) await sendMail({ to: email, subject: 'Your New Era code', html: `<p>Code: <b>${code}</b></p>` });
  return code;
}

function takeCode(key, code) {
  const rec = codes.get(key);
  if (!rec || rec.code !== String(code).trim() || Date.now() > rec.expires) return false;
  codes.delete(key);
  return true;
}

const tokenFor = (id) => Buffer.from(id).toString('base64');

// Security mail, best-effort: console/Mailhog now, real inbox after
// the domain is verified. Phone-only accounts have nowhere to send.
function signInMail(acc, req, how) {
  if (!acc?.email) return;
  const when = new Date().toISOString().replace('T', ' ').slice(0, 16);
  sendMail({
    to: acc.email,
    subject: 'New sign-in to New Era',
    html: `<p>Your account just signed in (${when} UTC via ${how}, IP ${req.ip}). If this wasn't you, reset your password from the sign-in screen.</p>`,
  }).catch(() => {});
}

export function authRoutes(app, prisma) {
  app.post('/auth/request-code', async (req, reply) => {
    const ip = req.ip;
    if (rateLimited(ip)) return reply.code(429).send({ error: 'too many requests' });
    const { email, phone } = req.body || {};
    const to = norm(email, phone);
    if (!to) return reply.code(400).send({ error: 'email or phone required' });
    if (email && /@(mailinator|tempmail|10minutemail)/.test(to)) {
      return reply.code(400).send({ error: 'disposable email blocked (ACC-6)' });
    }
    const code = await sendCode(to, { email: email ? to : undefined });
    return { sent: true, devCode: process.env.OTP_MODE === 'console' ? code : undefined };
  });

  app.get('/dev/otp', async (req) => {
    const to = req.query.to;
    return { to, ...(codes.get(to) || {}) };
  });

  app.post('/auth/verify', async (req, reply) => {
    const { email, phone, code, country } = req.body || {};
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
    const cleanPhone = phone ? String(phone).trim().replace(/[\s-]/g, '') : undefined;
    const to = cleanEmail || cleanPhone;
    if (!takeCode(to, code)) {
      return reply.code(400).send({ error: 'invalid or expired code' });
    }
    // explicit country, never inferred from email (ACC-2)
    const account = await prisma.account.upsert({
      where: cleanEmail ? { email: cleanEmail } : { phone: cleanPhone },
      update: {},
      create: { email: cleanEmail, phone: cleanPhone, country: country || 'NG' },
    });
    if (account.passwordHash) {
      return { needsPassword: true, accountId: account.id, hasPassword: true };
    }
    signInMail(account, req, 'code');
    return { token: tokenFor(account.id), account: safe(account) };
  });

  // 2nd step: password for accounts that set one.
  app.post('/auth/password', async (req, reply) => {
    if (rateLimited(req.ip)) return reply.code(429).send({ error: 'too many tries — wait a minute.' });
    const { accountId, password } = req.body || {};
    if (!accountId || !password) return reply.code(400).send({ error: 'accountId + password required' });
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc?.passwordHash || !checkPassword(password, acc.passwordHash)) {
      return reply.code(401).send({ error: 'wrong password' });
    }
    signInMail(acc, req, 'password');
    return { token: tokenFor(acc.id), account: safe(acc) };
  });

  // Forgot password: code to the account's email/phone, then reset.
  app.post('/auth/password/forgot', async (req, reply) => {
    if (rateLimited(req.ip)) return reply.code(429).send({ error: 'too many tries — wait a minute.' });
    const { email, phone } = req.body || {};
    const to = norm(email, phone);
    if (!to) return reply.code(400).send({ error: 'email or phone required' });
    const acc = await prisma.account.findFirst(
      email ? { where: { email: to } } : { where: { phone: to } },
    );
    if (!acc) return { sent: true }; // don't leak which contacts exist
    const code = await sendCode(`reset:${to}`, { email: email ? to : undefined });
    return { sent: true, devCode: process.env.OTP_MODE === 'console' ? code : undefined };
  });

  app.post('/auth/password/reset', async (req, reply) => {
    const { email, phone, code, password } = req.body || {};
    const to = norm(email, phone);
    if (!to || !code) return reply.code(400).send({ error: 'contact + code required' });
    if (!password || String(password).length < 8) {
      return reply.code(400).send({ error: 'password must be 8+ characters' });
    }
    if (!takeCode(`reset:${to}`, code)) {
      return reply.code(400).send({ error: 'invalid or expired code' });
    }
    const acc = await prisma.account.findFirst(
      email ? { where: { email: to } } : { where: { phone: to } },
    );
    if (!acc) return reply.code(400).send({ error: 'account not found' });
    const updated = await prisma.account.update({
      where: { id: acc.id },
      data: { passwordHash: hashPassword(String(password)) },
    });
    signInMail(updated, req, 'password reset');
    return { token: tokenFor(updated.id), account: safe(updated) };
  });

  const me = async (req, reply) => {
    const id = req.headers['x-account-id'];
    if (!id) return reply.code(401).send({ error: 'x-account-id required (stub auth)' });
    const acc = await prisma.account.findUnique({ where: { id } });
    if (acc) prisma.account.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    return acc ? safe(acc) : acc;
  };

  const authedRow = async (req, reply) => {
    const id = req.headers['x-account-id'];
    if (!id) {
      reply.code(401).send({ error: 'x-account-id required (stub auth)' });
      return null;
    }
    const row = await prisma.account.findUnique({ where: { id } });
    if (row) prisma.account.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    return row;
  };

  app.get('/me', async (req, reply) => me(req, reply));

  app.patch('/me/country', async (req, reply) => {
    const acc = await me(req, reply);
    if (!acc?.id) return acc;
    const updated = await prisma.account.update({
      where: { id: acc.id },
      data: { country: req.body.country },
    });
    return safe(updated);
  });

  app.patch('/me/mode', async (req, reply) => {
    const acc = await me(req, reply);
    if (!acc?.id) return acc;
    const updated = await prisma.account.update({
      where: { id: acc.id },
      data: { lastMode: req.body.mode }, // customer|business, remembers last (ACC-3)
    });
    return safe(updated);
  });

  // Signed-in user sets (or changes) their password. If one exists already,
  // the current password is required.
  app.post('/me/password', async (req, reply) => {
    const acc = await authedRow(req, reply);
    if (!acc) return;
    const { password, current } = req.body || {};
    if (!password || String(password).length < 8) {
      return reply.code(400).send({ error: 'password must be 8+ characters' });
    }
    if (acc.passwordHash && !checkPassword(current, acc.passwordHash)) {
      return reply.code(401).send({ error: 'current password is wrong' });
    }
    const updated = await prisma.account.update({
      where: { id: acc.id },
      data: { passwordHash: hashPassword(String(password)) },
    });
    return { ok: true, account: safe(updated) };
  });

  // Change email: code goes to the NEW address, then confirm swaps it.
  app.post('/me/email/request', async (req, reply) => {
    const acc = await authedRow(req, reply);
    if (!acc) return;
    const next = String(req.body?.email || '').trim().toLowerCase();
    if (!validEmail(next)) return reply.code(400).send({ error: 'enter a valid email' });
    const taken = await prisma.account.findUnique({ where: { email: next } });
    if (taken && taken.id !== acc.id) return reply.code(409).send({ error: 'email already in use' });
    const code = await sendCode(`change:${next}`, { email: next });
    return { sent: true, devCode: process.env.OTP_MODE === 'console' ? code : undefined };
  });

  app.post('/me/email/confirm', async (req, reply) => {
    const acc = await authedRow(req, reply);
    if (!acc) return;
    const next = String(req.body?.email || '').trim().toLowerCase();
    if (!takeCode(`change:${next}`, req.body?.code)) {
      return reply.code(400).send({ error: 'invalid or expired code' });
    }
    const taken = await prisma.account.findUnique({ where: { email: next } });
    if (taken && taken.id !== acc.id) return reply.code(409).send({ error: 'email already in use' });
    const updated = await prisma.account.update({ where: { id: acc.id }, data: { email: next } });
    return safe(updated);
  });

  // Change phone: same shape, code logged (SMS at beta).
  app.post('/me/phone/request', async (req, reply) => {
    const acc = await authedRow(req, reply);
    if (!acc) return;
    const next = norm(undefined, req.body?.phone);
    if (!next) return reply.code(400).send({ error: 'enter a valid phone number' });
    const taken = await prisma.account.findUnique({ where: { phone: next } });
    if (taken && taken.id !== acc.id) return reply.code(409).send({ error: 'phone already in use' });
    const code = await sendCode(`change:${next}`);
    return { sent: true, devCode: process.env.OTP_MODE === 'console' ? code : undefined };
  });

  app.post('/me/phone/confirm', async (req, reply) => {
    const acc = await authedRow(req, reply);
    if (!acc) return;
    const next = norm(undefined, req.body?.phone);
    if (!takeCode(`change:${next}`, req.body?.code)) {
      return reply.code(400).send({ error: 'invalid or expired code' });
    }
    const taken = await prisma.account.findUnique({ where: { phone: next } });
    if (taken && taken.id !== acc.id) return reply.code(409).send({ error: 'phone already in use' });
    const updated = await prisma.account.update({ where: { id: acc.id }, data: { phone: next } });
    return safe(updated);
  });
}
