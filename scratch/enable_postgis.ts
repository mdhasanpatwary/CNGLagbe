import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Enabling PostGIS...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS enabled successfully.');
    
    const version = await prisma.$queryRawUnsafe('SELECT PostGIS_Version();');
    console.log('PostGIS Version:', version);
  } catch (error) {
    console.error('Error enabling PostGIS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
