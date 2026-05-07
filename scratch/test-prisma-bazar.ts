import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const bazars = await prisma.bazar.findMany();
    console.log('Bazars found:', bazars);
  } catch (error) {
    console.error('Error fetching bazars:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
