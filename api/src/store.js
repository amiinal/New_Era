// Step 3–6 + 9: discovery, storefront, listings, threads/messages,
// reports, and local image serving (/img) for seed photos when R2
// isn't configured. All list/detail reads are public (CUS-9).
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const IMG_DIR = join(process.cwd(), '..', 'Docs', 'images');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const authed = async (req, reply, prisma) => {
  const id = req.headers['x-account-id'];
  if (!id) { reply.code(401).send({ error: 'x-account-id required' }); return null; }
  const acc = await prisma.account.findUnique({ where: { id } });
  if (!acc) { reply.code(401).send({ error: 'unknown account' }); return null; }
  // Presence: every authed hit refreshes the online dot (2min window).
  prisma.account.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return acc;
};

const ONLINE_MS = 120000;
const isOnline = (d) => !!d && Date.now() - new Date(d).getTime() < ONLINE_MS;

// Messages from others arrived after this account last opened the thread.
async function unreadFor(prisma, threadId, accId) {
  const mark = await prisma.threadRead.findUnique({
    where: { threadId_accountId: { threadId, accountId: accId } },
  }).catch(() => null);
  const since = mark?.at || new Date(0);
  return prisma.message.count({
    where: { threadId, senderId: { not: accId }, createdAt: { gt: since } },
  });
}

export function storeRoutes(app, prisma) {
  // DIS-1..8: country boundary (default = caller), optional city first.
  app.get('/discover', async req => {
    const { country, city, q, category } = req.query;
    if (!country) return [];
    const where = { country, hidden: false, suspended: false, ...(city ? { city } : {}), ...(category ? { category } : {}) };
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
    if (!b || b.hidden || b.suspended) return reply.code(404).send({ error: 'unknown storefront' });
    const { listings, collections, certificates, statuses, ...business } = b;
    return { business, listings: listings.filter(l => !l.hidden), collections, certificates, statuses };
  });

  app.get('/listings/:id', async (req, reply) => {
    const l = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!l || l.hidden) return reply.code(404).send({ error: 'unknown listing' });
    return l;
  });

  const ownListing = async (req, reply, prisma, acc) => {
    const l = await prisma.listing.findUnique({
      where: { id: req.params.id }, include: { business: true },
    });
    if (!l) { reply.code(404).send({ error: 'unknown listing' }); return null; }
    if (l.business.ownerId !== acc.id) { reply.code(403).send({ error: 'not your listing' }); return null; }
    return l;
  };

  // B2 listings management (LST): create/edit/delete + availability.
  // Limits exist as server_config (LST-11) but are not enforced at launch.
  app.post('/businesses/:id/listings', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    const { type, title, price, currency, availability, photos } = req.body || {};
    if (!title || !photos || photos.length < 1 || photos.length > 5) {
      return reply.code(400).send({ error: 'title + 1..5 photos required' });
    }
    return prisma.listing.create({
      data: {
        businessId: biz.id, type: type === 'service' ? 'service' : 'product',
        title, price: price || null,
        currency: currency || (biz.country === 'GH' ? 'GHS' : biz.country === 'KE' ? 'KES' : 'NGN'),
        availability: availability || 'in_stock', photos,
      },
    });
  });

  app.get('/businesses/:id/listings', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    return prisma.listing.findMany({ where: { businessId: biz.id }, orderBy: { createdAt: 'desc' } });
  });

  app.patch('/listings/:id', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const l = await ownListing(req, reply, prisma, acc);
    if (!l) return;
    const { title, price, availability, photos } = req.body || {};
    return prisma.listing.update({
      where: { id: l.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(availability ? { availability } : {}),
        ...(photos ? { photos } : {}),
      },
    });
  });

  app.delete('/listings/:id', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const l = await ownListing(req, reply, prisma, acc);
    if (!l) return;
    await prisma.listing.delete({ where: { id: l.id } });
    return { deleted: true };
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

  app.get('/threads/:id', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({
      where: { id: req.params.id },
      include: { business: true },
    });
    if (!t) return reply.code(404).send({ error: 'unknown thread' });
    const mine = t.customerId === acc.id || t.business.ownerId === acc.id;
    if (!mine) return reply.code(404).send({ error: 'unknown thread' });
    // Peer identity for tappable avatars + online dot.
    const peer = t.customerId === acc.id
      ? await prisma.account.findUnique({ where: { id: t.business.ownerId } }).then(o => ({
        kind: 'business', name: t.business.name, online: isOnline(o?.lastSeenAt),
        slug: t.business.slug, logoKey: t.business.logoKey,
      }))
      : await prisma.account.findUnique({ where: { id: t.customerId } }).then(c => ({
        kind: 'customer', name: c?.tagline || 'Customer', online: isOnline(c?.lastSeenAt),
        accountId: t.customerId, avatarKey: c?.avatarKey || null, tagline: c?.tagline || null,
      }));
    return { thread: t, peer };
  });

  app.get('/threads/:id/messages', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({ where: { id: req.params.id } });
    if (!t || (t.customerId !== acc.id && !(await prisma.business.findFirst({ where: { id: t.businessId, ownerId: acc.id } })))) {
      return reply.code(404).send({ error: 'unknown thread' });
    }
    // Opening the thread marks it read for this account.
    await prisma.threadRead.upsert({
      where: { threadId_accountId: { threadId: t.id, accountId: acc.id } },
      update: { at: new Date() },
      create: { threadId: t.id, accountId: acc.id },
    }).catch(() => {});
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

  const participant = async (acc, t) =>
    t.customerId === acc.id || !!(await prisma.business.findFirst({ where: { id: t.businessId, ownerId: acc.id } }));

  // Delete your own message.
  app.delete('/threads/:tid/messages/:mid', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({ where: { id: req.params.tid } });
    if (!t || !await participant(acc, t)) return reply.code(404).send({ error: 'unknown thread' });
    const m = await prisma.message.findFirst({ where: { id: req.params.mid, threadId: t.id } });
    if (!m) return reply.code(404).send({ error: 'unknown message' });
    if (m.senderId !== acc.id) return reply.code(403).send({ error: 'only your own messages' });
    await prisma.message.delete({ where: { id: m.id } });
    return { deleted: true };
  });

  // Delete the whole conversation (either side; gone for both).
  app.delete('/threads/:id', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const t = await prisma.thread.findUnique({ where: { id: req.params.id } });
    if (!t || !await participant(acc, t)) return reply.code(404).send({ error: 'unknown thread' });
    await prisma.message.deleteMany({ where: { threadId: t.id } });
    await prisma.threadRead.deleteMany({ where: { threadId: t.id } }).catch(() => {});
    await prisma.thread.delete({ where: { id: t.id } });
    return { deleted: true };
  });

  // STA-1..3: post photo/text status, 5/day from server_config, 24h expiry.
  app.post('/businesses/:id/statuses', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    const cfg = await prisma.serverConfig.findUnique({ where: { key: 'status_per_day' } });
    const limit = Number(cfg?.value ?? 5);
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const count = await prisma.status.count({ where: { businessId: biz.id, createdAt: { gt: since } } });
    if (count >= limit) return reply.code(429).send({ error: 'daily status limit reached' });
    const { kind, imageKey, text, bg, caption } = req.body || {};
    if (kind !== 'photo' && kind !== 'text') return reply.code(400).send({ error: 'kind must be photo|text' });
    if (kind === 'photo' && !imageKey) return reply.code(400).send({ error: 'imageKey required' });
    if (kind === 'text' && !text) return reply.code(400).send({ error: 'text required' });
    return prisma.status.create({
      data: {
        businessId: biz.id, kind,
        imageKey: imageKey || null, text: text || null, bg: bg || null,
        caption: caption || null,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });
  });

  // TRU-1: report anything; triage happens in /admin (Step 9).
  app.post('/reports', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { targetType, targetId, reason, contact } = req.body || {};
    if (!targetType || !targetId || !reason) return reply.code(400).send({ error: 'targetType, targetId, reason required' });
    const created = await prisma.report.create({
      data: {
        reporterId: acc.id, targetType, targetId, reason,
        contact: contact ? String(contact).slice(0, 120) : null,
      },
    });
    // Ping the team — real mail once the domain is verified, console until then.
    const { adminEmails } = await import('./admin.js');
    const { sendMail } = await import('./mail.js');
    for (const to of adminEmails()) {
      sendMail({ to, subject: `New Era report: ${targetType}`, html: `<p>${reason} — ${targetId}</p>` }).catch(() => {});
    }
    return created;
  });

  // Support inbox: message the team (web Support page), read replies here.
  app.post('/support/messages', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { body } = req.body || {};
    if (!body) return reply.code(400).send({ error: 'body required' });
    const created = await prisma.supportMessage.create({
      data: { accountId: acc.id, body: String(body).slice(0, 2000) },
    });
    const { adminEmails } = await import('./admin.js');
    const { sendMail } = await import('./mail.js');
    for (const to of adminEmails()) {
      sendMail({ to, subject: 'New Era support message', html: `<p>${acc.email || acc.phone}: ${String(body).slice(0, 500)}</p>` }).catch(() => {});
    }
    return created;
  });

  app.get('/support/mine', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    return prisma.supportMessage.findMany({
      where: { accountId: acc.id },
      orderBy: { createdAt: 'asc' },
    });
  });

  // ONB: create the account's business (one per account in the MVP).
  app.post('/businesses', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const existing = await prisma.business.findFirst({ where: { ownerId: acc.id } });
    if (existing) return reply.code(400).send({ error: 'one business per account in v1 (ACC-8)' });
    const { name, category, country, city, area, deliveryArea, nationwide, logoKey } = req.body || {};
    if (!name || !category || !country || !city) {
      return reply.code(400).send({ error: 'name, category, country, city required' });
    }
    const slug = `${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`;
    return prisma.business.create({
      data: {
        ownerId: acc.id, name: name.trim(), category, country, city,
        area: area || null,
        deliveryArea: nationwide ? 'Nationwide' : deliveryArea || null,
        logoKey: logoKey || null, slug,
      },
    });
  });

  // ONB-11: self-reported certificates (max 3 enforced).
  app.post('/businesses/:id/certificates', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    const n = await prisma.certificate.count({ where: { businessId: biz.id } });
    if (n >= 3) return reply.code(400).send({ error: 'max 3 certificates (ONB-11)' });
    const { title, issuer, year, photo } = req.body || {};
    if (!title || !photo) return reply.code(400).send({ error: 'title + photo required' });
    return prisma.certificate.create({
      data: { businessId: biz.id, title, issuer: issuer || null, year: year ? Number(year) : null, photo },
    });
  });

  // Owner-controlled storefront dressing: cover + logo + area.
  app.patch('/businesses/:id', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    const { coverKey, logoKey, area, deliveryArea, bio } = req.body || {};
    return prisma.business.update({
      where: { id: biz.id },
      data: {
        ...(coverKey !== undefined ? { coverKey } : {}),
        ...(logoKey !== undefined ? { logoKey } : {}),
        ...(area !== undefined ? { area } : {}),
        ...(deliveryArea !== undefined ? { deliveryArea } : {}),
        ...(bio !== undefined ? { bio: String(bio).split(/\s+/).filter(Boolean).slice(0, 250).join(' ') } : {}),
      },
    });
  });

  // Customer profile: photo + short tagline (shown on own profile only).
  app.patch('/me/profile', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { avatarKey, tagline, headerKey } = req.body || {};
    const updated = await prisma.account.update({
      where: { id: acc.id },
      data: {
        ...(avatarKey !== undefined ? { avatarKey } : {}),
        ...(tagline !== undefined ? { tagline: String(tagline).slice(0, 120) } : {}),
        ...(headerKey !== undefined ? { headerKey } : {}),
      },
    });
    const { passwordHash, ...rest } = updated;
    return { ...rest, hasPassword: !!passwordHash };
  });

  // Business home (Step 10): owned businesses for the mode switch.
  app.get('/me/businesses', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    return prisma.business.findMany({ where: { ownerId: acc.id } });
  });

  // CHT-4: my threads, either side — powers chat lists + unread badges.
  app.get('/me/threads', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const rows = await prisma.thread.findMany({
      where: { OR: [{ customerId: acc.id }, { business: { ownerId: acc.id } }] },
      include: {
        business: { select: { id: true, name: true, slug: true, ownerId: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const out = [];
    for (const t of rows) {
      out.push({
        ...t,
        unread: await unreadFor(prisma, t.id, acc.id),
        online: await (async () => {
          const otherId = t.customerId === acc.id ? t.business.ownerId : t.customerId;
          const other = await prisma.account.findUnique({ where: { id: otherId } }).catch(() => null);
          return isOnline(other?.lastSeenAt);
        })(),
      });
    }
    return out;
  });

  // ANA-1: append-only events. ANA-3: free 7/30d insights (real counts;
  // view metrics accumulate from first use — no backfilled guesses).
  app.post('/events', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { name, props } = req.body || {};
    if (!name) return reply.code(400).send({ error: 'name required' });
    return prisma.event.create({ data: { accountId: acc.id, name, props: props || {} } });
  });

  app.get('/businesses/:id/insights', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    const days = req.query.range === '30' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const [views, chats, listings, statuses] = await Promise.all([
      prisma.event.count({ where: { name: 'storefront_view', props: { path: ['businessId'], equals: biz.id }, createdAt: { gt: since } } }),
      prisma.thread.count({ where: { businessId: biz.id, createdAt: { gt: since } } }),
      prisma.listing.count({ where: { businessId: biz.id } }),
      prisma.status.count({ where: { businessId: biz.id, expiresAt: { gt: new Date() } } }),
    ]);
    return { range: days, storefrontViews: views, chatsStarted: chats, listings, activeStatuses: statuses };
  });

  app.get('/businesses/:id/threads', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const biz = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!biz || biz.ownerId !== acc.id) return reply.code(403).send({ error: 'not your business' });
    return prisma.thread.findMany({
      where: { businessId: biz.id }, orderBy: { createdAt: 'desc' }, take: 20,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  });

  // Local-dev fallback when R2 keys are absent: accept base64 inline and
  // store under Docs/images/uploads (served by /img). No new dependencies.
  app.post('/uploads/inline', async (req, reply) => {
    const acc = await authed(req, reply, prisma);
    if (!acc) return;
    const { name, data } = req.body || {};
    if (!name || !data) return reply.code(400).send({ error: 'name and base64 data required' });
    const buf = Buffer.from(String(data), 'base64');
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    if (buf.length < 1024 || (!isJpeg && !isPng)) {
      return reply.code(400).send({ error: 'not an image file — retry the photo' });
    }
    const safe = String(name).replace(/[^a-zA-Z0-9.-]/g, '').slice(-60) || 'photo.jpg';
    const key = `uploads/${Date.now()}-${safe}`;
    await mkdir(join(IMG_DIR, 'uploads'), { recursive: true });
    console.log(`[upload] ${key} bytes=${buf.length}`);
    await new Promise((resolve, reject) => {
      const ws = createWriteStream(join(IMG_DIR, key));
      ws.on('finish', resolve);
      ws.on('error', reject);
      ws.write(buf);
      ws.end();
    });
    return { key };
  });

  // Local dev only: serve Docs/images (including uploads/) as /img/<path>.
  app.get('/img/*', async (req, reply) => {
    const rel = (req.params['*'] || '').replace(/\\/g, '/');
    if (!rel || rel.includes('..')) {
      return reply.code(400).send({ error: 'bad name' });
    }
    try {
      const p = join(IMG_DIR, rel);
      const st = await stat(p);
      if (!st.isFile()) throw 0;
      const ext = '.' + (rel.split('.').pop() || '').toLowerCase();
      reply.header('content-type', MIME[ext] || 'application/octet-stream');
      reply.header('cache-control', 'public, max-age=86400');
      return reply.send(createReadStream(p));
    } catch { return reply.code(404).send({ error: 'no such image' }); }
  });
}
