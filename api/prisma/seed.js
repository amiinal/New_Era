// Seed: owner + 3 discovery-ready businesses.
// Mama's Kitchen (Lagos food service) uses the real Docs/images photos,
// served locally via GET /img/:name until R2 keys exist.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.status.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.business.deleteMany();
  await prisma.account.deleteMany();
  await prisma.serverConfig.deleteMany();

  await prisma.serverConfig.createMany({
    data: [
      { key: 'status_per_day', value: '5' },
      { key: 'discovery_min_items', value: '3' },
      { key: 'video_max_sec', value: '180' },
    ],
  });

  const owner = await prisma.account.create({
    data: { email: 'owner@example.com', country: 'NG', lastMode: 'business' },
  });

  const mama = await prisma.business.create({
    data: {
      name: "Mama's Kitchen", slug: 'mamas-kitchen', category: 'Food service',
      country: 'NG', city: 'Lagos', area: 'Ikeja', deliveryArea: 'Lagos (nationwide on request)',
      ownerId: owner.id,
    },
  });
  const dishes = [
    { title: 'Jollof Rice — Large', price: '5000', currency: 'NGN', photos: ['jollof-rice.jpg'], availability: 'in_stock' },
    { title: 'Fried Rice — Medium', price: '6000', currency: 'NGN', photos: ['fried-rice.jpg'], availability: 'in_stock' },
    { title: 'Moi Moi (4 wraps)', price: '2000', currency: 'NGN', photos: ['moi-moi.jpg'], availability: 'limited' },
  ];
  for (const d of dishes) {
    await prisma.listing.create({ data: { businessId: mama.id, type: 'product', ...d } });
  }
  await prisma.certificate.create({
    data: {
      businessId: mama.id, title: 'Food Hygiene Certificate',
      issuer: 'Lagos State Food Safety', year: 2025, photo: 'jollof-rice.jpg',
    },
  });
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  await prisma.status.createMany({
    data: [
      { businessId: mama.id, kind: 'text', text: 'Back in stock — party jollof pans', bg: 'coral', expiresAt: tomorrow },
      { businessId: mama.id, kind: 'text', text: 'Weekend Moi Moi — limited wraps', bg: 'teal', expiresAt: tomorrow },
    ],
  });

  const others = [
    { name: 'Accra Style Salon', slug: 'accra-style-salon', category: 'Salon', country: 'GH', city: 'Accra', area: 'Osu' },
    { name: 'Nairobi Tailors', slug: 'nairobi-tailors', category: 'Tailor', country: 'KE', city: 'Nairobi', area: 'Westlands' },
  ];
  for (const b of others) {
    const biz = await prisma.business.create({ data: { ...b, ownerId: owner.id } });
    for (let i = 1; i <= 3; i++) {
      await prisma.listing.create({
        data: {
          businessId: biz.id, type: 'product', title: `${b.name} item ${i}`,
          price: `${i * 2500}`, currency: b.country === 'GH' ? 'GHS' : 'KES',
          photos: [`business/${biz.id}/listing/demo${i}/feed.jpg`],
        },
      });
    }
  }
  console.log('seeded: mamas-kitchen (NG) + salon (GH) + tailor (KE)');
}

main().finally(() => prisma.$disconnect());
