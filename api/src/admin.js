// Step 9 (TRU-1): internal moderation queue. Guarded by ADMIN_EMAILS:
// only signed-in accounts whose email is listed there may call these.
// Never linked in the public nav — the team opens /admin directly.
import { sendMail } from './mail.js';
import { bearer, verifyAccess } from './token.js';

const admins = () =>
  String(process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export const adminEmails = () => admins();

async function guard(req, reply, prisma) {
  const sub = verifyAccess(bearer(req));
  if (!sub) { reply.code(401).send({ error: 'sign in first' }); return null; }
  const acc = await prisma.account.findUnique({ where: { id: sub } });
  if (!acc?.email || !admins().includes(acc.email.toLowerCase())) {
    reply.code(403).send({ error: 'admin only — ask to be added to ADMIN_EMAILS' });
    return null;
  }
  return acc;
}

async function describe(prisma, r) {
  try {
    const id = r.targetId;
    if (r.targetType === 'listing') {
      const l = await prisma.listing.findUnique({ where: { id }, include: { business: { select: { name: true } } } });
      if (l) return { label: `Listing “${l.title}” (${l.business.name})`, link: `/l/${l.id}` };
    } else if (r.targetType === 'business' || r.targetType === 'profile') {
      const b = await prisma.business.findUnique({ where: { id } });
      if (b) return { label: `Business “${b.name}”`, link: `/s/${b.slug}` };
      const a = await prisma.account.findUnique({ where: { id } });
      if (a) return { label: `Customer ${a.email || a.phone}`, link: null };
    } else if (r.targetType === 'status') {
      const s = await prisma.status.findUnique({ where: { id }, include: { business: { select: { name: true, slug: true } } } });
      if (s) return { label: `Status on ${s.business.name}`, link: `/s/${s.business.slug}` };
    } else if (r.targetType === 'chat') {
      const t = await prisma.thread.findUnique({ where: { id }, include: { business: { select: { name: true } } } });
      if (t) return { label: `Chat with ${t.business.name}`, link: null };
    } else if (r.targetType === 'certificate') {
      const c = await prisma.certificate.findUnique({ where: { id }, include: { business: { select: { name: true, slug: true } } } });
      if (c) return { label: `Certificate “${c.title}” (${c.business.name})`, link: `/s/${c.business.slug}` };
    }
  } catch { /* target deleted — fall through */ }
  return { label: `${r.targetType} ${r.targetId.slice(0, 8)}…`, link: null };
}

export function adminRoutes(app, prisma) {
  app.get('/admin/reports', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const rows = await prisma.report.findMany({
      ...(req.query.open !== '0' ? { where: { resolved: false } } : {}),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const out = [];
    for (const r of rows) {
      const reporter = await prisma.account.findUnique({ where: { id: r.reporterId } });
      const reporterContact = reporter ? (reporter.email || reporter.phone) : '?';
      out.push({
        ...r,
        reporter: reporterContact,
        reachOut: r.contact || reporterContact,
        ...(await describe(prisma, r)),
      });
    }
    return out;
  });

  app.post('/admin/reports/:id/resolve', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const r = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!r) return reply.code(404).send({ error: 'unknown report' });
    const { action } = req.body || {};
    if (action === 'hide') {
      if (r.targetType !== 'listing') {
        return reply.code(400).send({ error: 'hide applies to listings — suspend the store instead' });
      }
      await prisma.listing.updateMany({ where: { id: r.targetId }, data: { hidden: true } });
    } else if (action === 'suspend') {
      if (r.targetType !== 'business' && r.targetType !== 'profile') {
        return reply.code(400).send({ error: 'suspend applies to stores — hide the listing instead' });
      }
      await prisma.business.updateMany({ where: { id: r.targetId }, data: { suspended: true } });
    } else if (action !== 'dismiss') {
      return reply.code(400).send({ error: 'action must be dismiss|hide|suspend' });
    }
    return prisma.report.update({ where: { id: r.id }, data: { resolved: true, action } });
  });

  // Suspend / unsuspend a whole store (manual control, reversible).
  app.post('/admin/businesses/:id/suspend', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const updated = await prisma.business.update({
      where: { id: req.params.id },
      data: { suspended: !!req.body?.suspended },
    }).catch(() => null);
    if (!updated) return reply.code(404).send({ error: 'unknown business' });
    return updated;
  });

  // Support inbox: one thread per account, admin replies as the team.
  app.get('/admin/support', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const recent = await prisma.supportMessage.findMany({
      orderBy: { createdAt: 'desc' }, take: 300,
    });
    const byAcc = new Map();
    for (const m of recent) {
      if (!byAcc.has(m.accountId)) {
        const acc = await prisma.account.findUnique({ where: { id: m.accountId } });
        byAcc.set(m.accountId, {
          accountId: m.accountId,
          contact: acc ? (acc.email || acc.phone) : '?',
          last: m.body, lastAt: m.createdAt, unread: 0,
        });
      }
      if (!m.fromAdmin && !m.read) byAcc.get(m.accountId).unread += 1;
    }
    return [...byAcc.values()];
  });

  app.get('/admin/support/:accountId', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    await prisma.supportMessage.updateMany({
      where: { accountId: req.params.accountId, fromAdmin: false },
      data: { read: true },
    });
    return prisma.supportMessage.findMany({
      where: { accountId: req.params.accountId },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/admin/support/:accountId/reply', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const { body } = req.body || {};
    if (!body) return reply.code(400).send({ error: 'body required' });
    const msg = await prisma.supportMessage.create({
      data: { accountId: req.params.accountId, body: String(body).slice(0, 2000), fromAdmin: true, read: true },
    });
    const acc = await prisma.account.findUnique({ where: { id: req.params.accountId } });
    if (acc?.email) {
      sendMail({ to: acc.email, subject: 'New Era support replied', html: `<p>${String(body).slice(0, 500)}</p>` }).catch(() => {});
    }
    return msg;
  });

  // Analytics: signups + loop health for the beta.
  app.get('/admin/stats', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const [accounts, businesses, listings, threads, messages, reportsOpen, supportUnread] = await Promise.all([
      prisma.account.findMany({ select: { createdAt: true }, take: 5000 }),
      prisma.business.count(),
      prisma.listing.count(),
      prisma.thread.count(),
      prisma.message.count(),
      prisma.report.count({ where: { resolved: false } }),
      prisma.supportMessage.count({ where: { fromAdmin: false, read: false } }),
    ]);
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const n = accounts.filter(a => a.createdAt.toISOString().slice(0, 10) === key).length;
      days.push({ day: key.slice(5), n });
    }
    return {
      accounts: accounts.length, businesses, listings, threads, messages,
      reportsOpen, supportUnread, signupsByDay: days,
    };
  });

  // Kill switch: pause writes across app + web; reads stay up.
  app.get('/admin/maintenance', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const [on, message] = await Promise.all([
      prisma.serverConfig.findUnique({ where: { key: 'maintenance_on' } }),
      prisma.serverConfig.findUnique({ where: { key: 'maintenance_message' } }),
    ]);
    return { on: on?.value === '1', message: message?.value || '' };
  });

  app.post('/admin/maintenance', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const { on, message } = req.body || {};
    await prisma.serverConfig.upsert({
      where: { key: 'maintenance_on' },
      update: { value: on ? '1' : '0' },
      create: { key: 'maintenance_on', value: on ? '1' : '0' },
    });
    if (message !== undefined) {
      await prisma.serverConfig.upsert({
        where: { key: 'maintenance_message' },
        update: { value: String(message).slice(0, 200) },
        create: { key: 'maintenance_message', value: String(message).slice(0, 200) },
      });
    }
    return { on: !!on };
  });

  app.get('/admin/accounts', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return [];
    const rows = await prisma.account.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
    const out = [];
    for (const a of rows) {
      if (!((a.email || '').toLowerCase().includes(q) || (a.phone || '').includes(q))) continue;
      const businesses = await prisma.business.findMany({
        where: { ownerId: a.id },
        select: { id: true, name: true, slug: true, hidden: true, suspended: true },
      });
      const { passwordHash, ...rest } = a;
      out.push({ ...rest, businesses });
      if (out.length >= 10) break;
    }
    return out;
  });

  app.get('/admin/businesses', async (req, reply) => {
    if (!await guard(req, reply, prisma)) return;
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return [];
    return (await prisma.business.findMany({ take: 50, orderBy: { createdAt: 'desc' } }))
      .filter(b => b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.slug.includes(q))
      .slice(0, 10);
  });
}
