// Step 1 seed: 1 account + 3 discovery-ready businesses (Lagos, Accra, Nairobi)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.status.deleteMany();
  await prisma.listing.deleteMany();
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

  const demo = [
    { name: 'Mama Cakes', slug: 'mama-cakes', category: 'Bakery', country: 'NG', city: 'Lagos', area: 'Ikeja' },
    { name: 'Accra Style Salon', slug: 'accra-style-salon', category: 'Salon', country: 'GH', city: 'Accra', area: 'Osu' },
    { name: 'Nairobi Tailors', slug: 'nairobi-tailors', category: 'Tailor', country: 'KE', city: 'Nairobi', area: 'Westlands' },
  ];

  for (const b of demo) {
    const biz = await prisma.business.create({ data: { ...b, ownerId: owner.id } });
    for (let i = 1; i <= 3; i++) {
      await prisma.listing.create({
        data: {
          businessId: biz.id,
          type: 'product',
          title: `${b.name} item ${i}`,
          price: `${i * 2500}`,
          photos: [`business/${biz.id}/listing/demo${i}/feed.jpg`],
        },
      });
    }
  }
  console.log('seeded 3 businesses, Lagos/Accra/Nairobi');
}

main().finally(() => prisma.$disconnect());
