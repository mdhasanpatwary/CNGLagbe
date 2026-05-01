import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting concurrent queries test...");
  const start = Date.now();

  // Run 5 concurrent queries
  const queries = Array.from({ length: 5 }).map(async (_, i) => {
    const qStart = Date.now();
    // Simple query that hits the DB
    const count = await prisma.booking.count();
    const qEnd = Date.now();
    console.log(`Query ${i + 1} took ${qEnd - qStart}ms`);
    return count;
  });

  await Promise.all(queries);
  const end = Date.now();
  console.log(`Total time for 5 concurrent queries: ${end - start}ms`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
