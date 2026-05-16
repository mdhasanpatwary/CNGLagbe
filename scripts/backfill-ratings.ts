import { prisma } from "@/lib/prisma";

async function backfill() {
  console.log("Starting rating count backfill...");
  
  const drivers = await prisma.driver.findMany({
    include: {
      bookings: {
        where: {
          rating: { not: null }
        }
      }
    }
  });

  for (const driver of drivers) {
    const ratingCount = driver.bookings.length;
    const ratings = driver.bookings.map(b => b.rating as number);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        ratingCount,
        averageRating
      }
    });
    console.log(`Updated driver ${driver.name}: ${averageRating} (${ratingCount})`);
  }

  console.log("Backfill complete!");
}

backfill().catch(console.error);
