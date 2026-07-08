import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const driverId = "cmrc60uwt0009l10474kw1lqp";
  console.log("Trying to increment callCount for driver ID:", driverId);
  try {
    const updated = await prisma.contributedDriver.update({
      where: { id: driverId },
      data: {
        callCount: {
          increment: 1,
        },
      },
    });
    console.log("Success! Updated driver:", updated);
  } catch (error) {
    console.error("Failed to increment callCount:", error);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
