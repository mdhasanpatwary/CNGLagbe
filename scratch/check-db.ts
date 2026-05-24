import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true }
  });
  console.log("Users:", JSON.stringify(users, null, 2));

  const drivers = await prisma.driver.findMany({
    select: { id: true, name: true, phone: true, isOnline: true }
  });
  console.log("Drivers:", JSON.stringify(drivers, null, 2));

  const activeBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: ["PENDING", "ACCEPTED", "ARRIVED"]
      }
    },
    include: {
      user: true,
      driver: true
    }
  });
  console.log("Active Bookings:", JSON.stringify(activeBookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
