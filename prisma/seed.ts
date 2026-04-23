import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Demo User
  const user = await prisma.user.upsert({
    where: { phone: '01700000000' },
    update: {},
    create: {
      name: 'Rahim User',
      phone: '01700000000',
    },
  })

  // Demo Drivers
  const hashedPassword = bcrypt.hashSync('driver123', 10)
  
  const driver1 = await prisma.driver.upsert({
    where: { phone: '01711111111' },
    update: { passwordHash: hashedPassword, isApproved: true, currentLat: 23.8103, currentLng: 90.4125 },
    create: {
      name: 'Karim Driver',
      phone: '01711111111',
      passwordHash: hashedPassword,
      isApproved: true,
      currentLat: 23.8103,
      currentLng: 90.4125,
    },
  })

  // Dummy Bookings
  console.log('Creating dummy bookings...')

  // 1. Pending Bookings (Incoming Requests)
  await prisma.booking.createMany({
    data: [
      {
        userId: user.id,
        pickupLat: 23.8103,
        pickupLng: 90.4125,
        destLat: 23.8203,
        destLng: 90.4225,
        pickupAddress: 'Dhanmondi 32',
        destAddress: 'Banani 11',
        distance: 5.2,
        fare: 150,
        status: 'PENDING',
      },
      {
        userId: user.id,
        pickupLat: 23.7503,
        pickupLng: 90.3925,
        destLat: 23.7703,
        destLng: 90.4125,
        pickupAddress: 'Farmgate',
        destAddress: 'Gulshan 1',
        distance: 3.5,
        fare: 120,
        status: 'PENDING',
      }
    ]
  })

  // 2. Ongoing Booking (Already Accepted by current driver)
  await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.8103,
      pickupLng: 90.4125,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Uttara Sector 7',
      destAddress: 'Airport',
      distance: 2.1,
      fare: 80,
      status: 'ACCEPTED',
    }
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
