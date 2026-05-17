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
    update: { passwordHash: hashedPassword, isApproved: true, currentLat: 23.0361, currentLng: 91.5194 },
    create: {
      name: 'Karim Driver',
      phone: '01711111111',
      passwordHash: hashedPassword,
      isApproved: true,
      currentLat: 23.0361,
      currentLng: 91.5194,
      licenseNumber: "DEMO-LICENSE-123",
      nidNumber: "1234567890",
      vehicleNumber: "DHAKA-TH-11-2222",
      photoUrl: "https://via.placeholder.com/150",
      nidFrontUrl: "https://via.placeholder.com/300x200",
      nidBackUrl: "https://via.placeholder.com/300x200",
      licenseFrontUrl: "https://via.placeholder.com/300x200",
      licenseBackUrl: "https://via.placeholder.com/300x200",
      vehicleType: "CNG",
    },
  })

  // Dummy Bookings
  console.log('Creating dummy bookings...')

  // 1. Pending Bookings (Incoming Requests)
  await prisma.booking.createMany({
    data: [
      {
        userId: user.id,
        pickupLat: 23.0361,
        pickupLng: 91.5194,
        destLat: 23.8203,
        destLng: 90.4225,
        pickupAddress: 'Dhanmondi 32',
        destAddress: 'Banani 11',
        distance: 5.2,
        fare: 178,
        baseFare: 178,
        platformFee: 10,
        totalFare: 188,
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
        fare: 153,
        baseFare: 153,
        platformFee: 10,
        totalFare: 163,
        status: 'PENDING',
      }
    ]
  })

  // 2. Ongoing Booking (Already Accepted by current driver)
  await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.0361,
      pickupLng: 91.5194,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Uttara Sector 7',
      destAddress: 'Airport',
      distance: 2.1,
      fare: 132,
      baseFare: 132,
      platformFee: 10,
      totalFare: 142,
      status: 'ACCEPTED',
    }
  })

  // Initialize wallet for driver1
  const driverWallet = await prisma.driverWallet.upsert({
    where: { driverId: driver1.id },
    update: { balance: 651 }, // 651 net balance after positive/negative transactions
    create: {
      driverId: driver1.id,
      balance: 651,
    }
  })

  // Dummy Completed bookings for historical transaction links
  const completedBooking1 = await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.0361,
      pickupLng: 91.5194,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Mirpur 10',
      destAddress: 'Motijheel',
      distance: 12.5,
      fare: 450,
      baseFare: 450,
      platformFee: 22.5,
      totalFare: 472.5,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    }
  })

  const completedBooking2 = await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.0361,
      pickupLng: 91.5194,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Gulshan 2',
      destAddress: 'Dhanmondi 27',
      distance: 8.2,
      fare: 300,
      baseFare: 300,
      platformFee: 15,
      totalFare: 315,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  })

  const completedBooking3 = await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.0361,
      pickupLng: 91.5194,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Baddah',
      destAddress: 'Uttara',
      distance: 14.2,
      fare: 500,
      baseFare: 500,
      platformFee: 25,
      totalFare: 525,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }
  })

  const completedBooking4 = await prisma.booking.create({
    data: {
      userId: user.id,
      driverId: driver1.id,
      pickupLat: 23.0361,
      pickupLng: 91.5194,
      destLat: 23.8503,
      destLng: 90.4525,
      pickupAddress: 'Mohakhali',
      destAddress: 'Tejgaon',
      distance: 3.5,
      fare: 150,
      baseFare: 150,
      platformFee: 10,
      totalFare: 160,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    }
  })

  // Create Wallet Transactions
  await prisma.walletTransaction.deleteMany({
    where: { walletId: driverWallet.id }
  })

  await prisma.walletTransaction.createMany({
    data: [
      {
        walletId: driverWallet.id,
        amount: -22.5,
        type: 'BOOKING_FEE',
        bookingId: completedBooking1.id,
        details: 'Platform fee for trip from Mirpur 10 to Motijheel',
        createdAt: completedBooking1.createdAt,
      },
      {
        walletId: driverWallet.id,
        amount: -15.0,
        type: 'BOOKING_FEE',
        bookingId: completedBooking2.id,
        details: 'Platform fee for trip from Gulshan 2 to Dhanmondi 27',
        createdAt: completedBooking2.createdAt,
      },
      {
        walletId: driverWallet.id,
        amount: 500.0,
        type: 'PAYMENT',
        details: 'Agent Wallet Recharge',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        walletId: driverWallet.id,
        amount: -25.0,
        type: 'BOOKING_FEE',
        bookingId: completedBooking3.id,
        details: 'Platform fee for trip from Baddah to Uttara',
        createdAt: completedBooking3.createdAt,
      },
      {
        walletId: driverWallet.id,
        amount: 300.0,
        type: 'PAYMENT',
        details: 'Admin Balance Adjustment',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      {
        walletId: driverWallet.id,
        amount: -10.0,
        type: 'BOOKING_FEE',
        bookingId: completedBooking4.id,
        details: 'Platform fee for trip from Mohakhali to Tejgaon',
        createdAt: completedBooking4.createdAt,
      },
      {
        walletId: driverWallet.id,
        amount: -76.5,
        type: 'ADJUSTMENT',
        details: 'Previous balance carryover debit',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      }
    ]
  })

  // System Settings
  console.log('Seeding system settings...')
  await prisma.systemSetting.upsert({
    where: { key: 'MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS' },
    update: {},
    create: {
      key: 'MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS',
      value: '-100',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'PLATFORM_FEE_PERCENTAGE' },
    update: {},
    create: {
      key: 'PLATFORM_FEE_PERCENTAGE',
      value: '5',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'DRIVER_SEARCH_RADIUS_KM' },
    update: {},
    create: {
      key: 'DRIVER_SEARCH_RADIUS_KM',
      value: '3',
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
