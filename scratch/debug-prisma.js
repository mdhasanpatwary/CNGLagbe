const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing Prisma connection...");
    const bazars = await prisma.bazar.findMany();
    console.log("Bazars found:", bazars);
    
    console.log("Testing Driver query...");
    const drivers = await prisma.driver.findMany({
      select: { nearbyBazar: true }
    });
    console.log("Drivers found:", drivers.length);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
