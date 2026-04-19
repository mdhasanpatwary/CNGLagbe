import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Demo User
  await prisma.user.upsert({
    where: { phone: '01700000000' },
    update: {},
    create: {
      name: 'Rahim User',
      phone: '01700000000',
    },
  })

  // Demo Drivers
  const hashedPassword = bcrypt.hashSync('driver123', 10)
  
  await prisma.driver.upsert({
    where: { phone: '01711111111' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Karim Driver',
      phone: '01711111111',
      passwordHash: hashedPassword,
    },
  })

  const hashedPassword2 = bcrypt.hashSync('driver456', 10)

  await prisma.driver.upsert({
    where: { phone: '01722222222' },
    update: { passwordHash: hashedPassword2 },
    create: {
      name: 'Kamal Driver',
      phone: '01722222222',
      passwordHash: hashedPassword2,
    },
  })

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
