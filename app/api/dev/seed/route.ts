import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

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

    // Create Default Bazars
    const defaultBazars = [
      "Shuvopur",
      "Boktarhat",
      "Chandgazi",
      "Mirzarhat",
      "Chhagalnaiya"
    ];

    await Promise.all(
      defaultBazars.map((name) =>
        prisma.bazar.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    // Create/Update Default Driver
    const hashedPassword = bcrypt.hashSync("driver123", 10);
    const driver = await prisma.driver.upsert({
      where: { phone: "01711111111" },
      update: { 
        passwordHash: hashedPassword, 
        isApproved: true, 
        currentLat: 23.0361, 
        currentLng: 91.5194,
        nearbyBazar: "Chhagalnaiya"
      },
      create: {
        name: "Karim Driver",
        phone: "01711111111",
        passwordHash: hashedPassword,
        isApproved: true,
        currentLat: 23.0361,
        currentLng: 91.5194,
        nearbyBazar: "Chhagalnaiya",
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
    });

    // Create 3 Pending Bookings
    const pendingBookings = [
      {
        userId: user.id,
        pickupLat: 23.0361,
        pickupLng: 91.5194,
        destLat: 23.8203,
        destLng: 90.4225,
        pickupAddress: "Dhanmondi 32, Dhaka",
        destAddress: "Banani 11 Shopping Center",
        distance: 5.2,
        fare: 178,
        baseFare: 178,
        platformFee: 10,
        totalFare: 188,
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
        fare: 153,
        baseFare: 153,
        platformFee: 10,
        totalFare: 163,
        status: "PENDING",
      },
      {
        userId: user.id,
        pickupLat: 23.0361,
        pickupLng: 91.5194,
        destLat: 23.8003,
        destLng: 90.3825,
        pickupAddress: "Mirpur 10 Circle",
        destAddress: "Gabtoli Terminal",
        distance: 4.1,
        fare: 162,
        baseFare: 162,
        platformFee: 10,
        totalFare: 172,
        status: "PENDING",
      }
    ];

    await prisma.booking.createMany({ data: pendingBookings });

    // Create one Accepted/Ongoing Booking for current driver
    await prisma.booking.create({
      data: {
        userId: user.id,
        driverId: driver.id,
        pickupLat: 23.0361,
        pickupLng: 91.5194,
        destLat: 23.8503,
        destLng: 90.4525,
        pickupAddress: "Uttara Sector 7, Lake View",
        destAddress: "Hazrat Shahjalal International Airport",
        distance: 2.1,
        fare: 132,
        baseFare: 132,
        platformFee: 10,
        totalFare: 142,
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Database seeded with 3 pending and 1 accepted booking.` 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
