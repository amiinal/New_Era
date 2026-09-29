// Step 3–6 + 9: discovery, storefront, listings, threads/messages,
// reports, and local image serving (/img) for seed photos when R2
// isn't configured. All list/detail reads are public (CUS-9).
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

const IMG_DIR = join(process.cwd(), '..', 'Docs', 'images');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const authed = async (req, reply, prisma) => {
  const id = req.headers['x-account-id'];
  if (!id) { reply.code(401).send({ error: 'x-account-id required' }); return null; }
  const acc = await prisma.account.findUnique({ where: { id } });
  if (!acc) { reply.code(401).send({ error: 'unknown account' }); return null; }
  return acc;
};

export function storeRoutes(app, prisma) {
  // DIS-1..8: country boundary (default = caller), optional city first.
  app.get('/discover', async req => {
    const { country, city, q, category } = req.query;
    if (!country) return [];
    const where = { country, ...(city ? { city } : {}), ...(category ? { category } : {}) };
    const all = await prisma.business.findMany({
      where,
      include: { listings: { select: { photos: true } } },
      take: 50,
    });
    // DIS-7 eligibility: 3+ items with photos, category, location.
    let list = all.filter(b => b.listings.length >= 3 && b.category && (b.city || b.area));
    if (q) {
      const needle = String(q).toLowerCase();
      list = list
        .map(b => ({ b, hit: `${b.name} ${b.category}`.toLowerCase().includes(needle) ? 1 : 0 }))
        .filter(r => r.hit)
        .map(r => r.b);
    }
    return list.map(({ listings: _drop, ...b }) => b);
  });

  // WEB-1: public storefront bundle (profile + listings + collections +
  // active statuses + certificates). No exact addresses beyond area (WEB-5).
  app.get('/storefront/:slug', async (req, reply) => {
    const b = await prisma.business.findUnique({
      where: { slug: req.params.slug },
      include: {
        listings: true,
        collections: true,
        certificates: true,
        statuses: { where: { expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!b) return reply.code(404).send({ error: 'unknown storefront' });
    const { listings, collections, certificates, statuses, ...business } = b;
    return { business, listings, collections, certificates, statuses };
  });

  app.get('/listings/:id', async (req, reply) => {
    const l = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!l) return reply.code(404).send({ error: 'unknown listing' });
    return l;
  });

  // CHT: open (or reuse) a thread; ACC-7 blocks chatting with own store.
  app.post('/threads', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { businessId, listingId } = req.body || {};
    const biz = await prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) return reply.code(404).send({ error: 'unknown business' });
    if (biz.ownerId === acc.id) return reply.code(400).send({ error: 'own storefront — use preview instead' });
    const existing = await prisma.thread.findFirst({
      where: { businessId, customerId: acc.id, listingId: listingId || null },
    });
    if (existing) return existing;
    return prisma.thread.create({ data: { businessId, customerId: acc.id, listingId: listingId || null } });
  });

  app.get('/threads/:id/messages', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({ where: { id: req.params.id } });
    if (!t || (t.customerId !== acc.id && !(await prisma.business.findFirst({ where: { id: t.businessId, ownerId: acc.id } })))) {
      return reply.code(404).send({ error: 'unknown thread' });
    }
    return prisma.message.findMany({ where: { threadId: t.id }, orderBy: { createdAt: 'asc' } });
  });

  app.post('/threads/:id/messages', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({ where: { id: req.params.id } });
    if (!t) return reply.code(404).send({ error: 'unknown thread' });
    const { body, imageKey } = req.body || {};
    if (!body && !imageKey) return reply.code(400).send({ error: 'body or imageKey required (CHT-2: text+images)' });
    return prisma.message.create({ data: { threadId: t.id, senderId: acc.id, body: body || null, imageKey: imageKey || null } });
  });

  // TRU-1: report anything; triage happens in /admin (Step 9).
  app.post('/reports', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { targetType, targetId, reason } = req.body || {};
    if (!targetType || !targetId || !reason) return reply.code(400).send({ error: 'targetType, targetId, reason required' });
    return prisma.report.create({ data: { reporterId: acc.id, targetType, targetId, reason } });
  });

  // Local dev only: serve Docs/images seed photos as /img/:name.
  app.get('/img/:name', async (req, reply) => {
    const p = join(IMG_DIR, req.params.name);
    if (p !== join(IMG_DIR, req.params.name) || req.params.name.includes('..')) {
      return reply.code(400).send({ error: 'bad name' });
    }
    try {
      const st = await stat(p);
      if (!st.isFile()) throw 0;
      const ext = '.' + (req.params.name.split('.').pop() || '').toLowerCase();
      reply.header('content-type', MIME[ext] || 'application/octet-stream');
      reply.header('cache-control', 'public, max-age=86400');
      return reply.send(createReadStream(p));
    } catch { return reply.code(404).send({ error: 'no such image' }); }
  });
}
