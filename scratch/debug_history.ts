import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const phone = "01783721411";
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("User ID:", user.id);
  console.log("User Role:", user.role);

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  console.log("Total Bookings:", bookings.length);
  if (bookings.length > 0) {
    console.log("Latest Booking Status:", bookings[0].status);
    console.log("Latest Booking Created At:", bookings[0].createdAt);
  } else {
    console.log("No bookings found in DB for this user.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
