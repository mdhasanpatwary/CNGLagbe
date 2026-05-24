import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.driverPushToken.findMany({
    include: {
      driver: true
    }
  });
  console.log("Registered Push Tokens:", JSON.stringify(tokens, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
