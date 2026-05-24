import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
          phone: true
        }
      }
    }
  });
  console.log("Recent Bookings:", JSON.stringify(bookings, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
