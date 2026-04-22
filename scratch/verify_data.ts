import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  console.log("User:", JSON.stringify(user, null, 2));

  const drivers = await prisma.driver.findMany();
  console.log("All Drivers:", JSON.stringify(drivers, null, 2));

  const activeBookings = await prisma.booking.findMany({
    where: { status: { in: ["PENDING", "ACCEPTED"] } },
    take: 5,
    orderBy: { createdAt: "desc" }
  });
  console.log("Active Bookings:", JSON.stringify(activeBookings, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
