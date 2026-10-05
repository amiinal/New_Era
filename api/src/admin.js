// Step 9 (TRU-1): internal moderation queue. Guarded by ADMIN_EMAILS:
// only signed-in accounts whose email is listed there may call these.
// Never linked in the public nav — the team opens /admin directly.
const admins = () =>
  String(process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

async function guard(req, reply, prisma) {
  const id = req.headers['x-account-id'];
  if (!id) { reply.code(401).send({ error: 'sign in first' }); return null; }
  const acc = await prisma.account.findUnique({ where: { id } });
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
      if (r.targetType === 'listing') {
        await prisma.listing.updateMany({ where: { id: r.targetId }, data: { hidden: true } });
      } else if (r.targetType === 'business' || r.targetType === 'profile') {
        await prisma.business.updateMany({ where: { id: r.targetId }, data: { hidden: true } });
      } else {
        return reply.code(400).send({ error: 'hide applies to listings + businesses only' });
      }
    } else if (action !== 'dismiss') {
      return reply.code(400).send({ error: 'action must be dismiss|hide' });
    }
    return prisma.report.update({ where: { id: r.id }, data: { resolved: true, action } });
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
        select: { id: true, name: true, slug: true, hidden: true },
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
