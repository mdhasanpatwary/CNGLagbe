import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.booking.updateMany({
    where: {
      status: {
        in: ["PENDING", "ACCEPTED", "ARRIVED", "PICKED_UP"]
      }
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "SYSTEM",
      cancelReason: "E2E testing reset"
    }
  });
  console.log(`Cancelled ${result.count} active bookings.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
