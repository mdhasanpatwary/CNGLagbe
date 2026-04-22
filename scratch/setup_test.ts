import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "cmo5ahkry0000hk074dvoe8mj";
  
  // Cancel all active bookings for this user to allow new tests
  const result = await prisma.booking.updateMany({
    where: {
      userId,
      status: { in: ["PENDING", "ACCEPTED"] }
    },
    data: {
      status: "CANCELLED",
      cancelledBy: "ADMIN",
      cancelledAt: new Date(),
    }
  });
  
  console.log(`Cancelled ${result.count} active bookings for user ${userId}`);

  // Also approve Kamal Driver (01722222222) for testing
  const driver = await prisma.driver.updateMany({
    where: { phone: "01722222222" },
    data: { isApproved: true }
  });
  console.log(`Approved ${driver.count} drivers (Kamal)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
