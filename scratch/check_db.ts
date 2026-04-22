import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const version = await prisma.$queryRaw`SELECT PostGIS_Version();`;
    console.log('PostGIS Version:', version);
  } catch (error) {
    console.error('PostGIS not enabled or error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
