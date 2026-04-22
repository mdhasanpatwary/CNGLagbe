
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '01783721411';
  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: 'ADMIN' },
    create: {
      phone,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user updated/created:', JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
