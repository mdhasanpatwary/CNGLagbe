import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, pickupAddress: true, destAddress: true, pickupLat: true, pickupLng: true }
  });
  console.log(bookings);
}
main().catch(console.error).finally(() => prisma.$disconnect());
