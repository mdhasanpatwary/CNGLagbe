import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing Bazar model...");
    const bazars = await prisma.bazar.findMany();
    console.log("Bazars found:", bazars);
    
    console.log("Testing Driver model nearbyBazar aggregation...");
    const drivers = await prisma.driver.findMany({
      select: { nearbyBazar: true }
    });
    console.log("Drivers nearbyBazar list:", drivers);
    
    console.log("Test success!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
