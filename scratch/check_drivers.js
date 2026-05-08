const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const drivers = await prisma.driver.findMany();
    console.log('DRIVERS_START');
    console.log(JSON.stringify(drivers, null, 2));
    console.log('DRIVERS_END');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
