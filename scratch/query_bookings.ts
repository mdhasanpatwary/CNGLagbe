import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: true
    }
  });
  console.log("Total Bookings:", bookings.length);
  for (const b of bookings) {
    console.log(`Booking ID: ${b.id}`);
    console.log(`  User ID: ${b.userId}`);
    console.log(`  User Role: ${b.user?.role}`);
    console.log(`  Status: ${b.status}`);
  }
}

run().finally(() => prisma.$disconnect());
