const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.delete({
      where: { id: 'cmocu5o2g0000hky2xd9b5j1j' }
    });
    console.log('Deleted duplicate user');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
