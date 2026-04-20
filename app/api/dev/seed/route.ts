import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Clear some old data if needed or just add new
    // For safer dev, let's just create new stuff
    
    // Create Test User
    const user = await prisma.user.upsert({
      where: { phone: "01700000000" },
      update: {},
      create: {
        name: "Rahim User",
        phone: "01700000000",
      },
    });

    // Create/Update Default Driver
    const hashedPassword = bcrypt.hashSync("driver123", 10);
    const driver = await prisma.driver.upsert({
      where: { phone: "01711111111" },
      update: { passwordHash: hashedPassword },
      create: {
        name: "Karim Driver",
        phone: "01711111111",
        passwordHash: hashedPassword,
      },
    });

    // Create 3 Pending Bookings
    const pendingBookings = [
      {
        userId: user.id,
        pickupLat: 23.8103,
        pickupLng: 90.4125,
        destLat: 23.8203,
        destLng: 90.4225,
        pickupAddress: "Dhanmondi 32, Dhaka",
        destAddress: "Banani 11 Shopping Center",
        distance: 5.2,
        fare: 150,
        status: "PENDING",
      },
      {
        userId: user.id,
        pickupLat: 23.7503,
        pickupLng: 90.3925,
        destLat: 23.7703,
        destLng: 90.4125,
        pickupAddress: "Farmgate Bus Stand",
        destAddress: "Gulshan 1 Circle",
        distance: 3.5,
        fare: 120,
        status: "PENDING",
      },
      {
        userId: user.id,
        pickupLat: 23.8103,
        pickupLng: 90.4125,
        destLat: 23.8003,
        destLng: 90.3825,
        pickupAddress: "Mirpur 10 Circle",
        destAddress: "Gabtoli Terminal",
        distance: 4.1,
        fare: 140,
        status: "PENDING",
      }
    ];

    for (const b of pendingBookings) {
      await prisma.booking.create({ data: b });
    }

    // Create one Accepted/Ongoing Booking for current driver
    await prisma.booking.create({
      data: {
        userId: user.id,
        driverId: driver.id,
        pickupLat: 23.8103,
        pickupLng: 90.4125,
        destLat: 23.8503,
        destLng: 90.4525,
        pickupAddress: "Uttara Sector 7, Lake View",
        destAddress: "Hazrat Shahjalal International Airport",
        distance: 2.1,
        fare: 80,
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded with 3 pending and 1 accepted booking for driver 01711111111" 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
