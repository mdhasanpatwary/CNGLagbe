const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.driver.delete({
      where: { id: 'cmohfb3nd0001hkumrreud712' }
    });
    console.log('Deleted duplicate driver');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
