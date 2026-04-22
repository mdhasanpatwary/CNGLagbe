import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";

interface RequestItem {
  id: string;
  distance: number;
  fare: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  pickupAddress?: string;
  destAddress?: string;
  createdAt: string;
}

export async function GET() {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get driver location and check for active booking in single query
    const driverWithActiveBooking = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        currentLat: true,
        currentLng: true,
        bookings: {
          where: { status: "ACCEPTED" },
          take: 1,
        },
      },
    });

    if (!driverWithActiveBooking) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const { currentLat, currentLng, bookings: activeBookings } = driverWithActiveBooking;

    if (activeBookings.length > 0) {
      return NextResponse.json({
        requests: [],
        currentBooking: activeBookings[0],
      });
    }

    if (currentLat == null || currentLng == null) {
      return NextResponse.json({ requests: [], currentBooking: null });
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Optimized geospatial query: Use ST_DWithin for index-based filtering
    const requests: RequestItem[] = await prisma.$queryRaw`
      SELECT
        b."id",
        b."pickupLat",
        b."pickupLng",
        b."destLat",
        b."destLng",
        b."distance",
        b."fare",
        b."pickupAddress",
        b."destAddress",
        b."createdAt",
        ST_DistanceSphere(
          ST_MakePoint(b."pickupLng", b."pickupLat"),
          ST_MakePoint(${currentLng}::float8, ${currentLat}::float8)
        ) / 1000 AS "distance"
      FROM "Booking" b
      LEFT JOIN "BookingRejection" br ON br."bookingId" = b."id" AND br."driverId" = ${driverId}
      WHERE
        b."status" = 'PENDING'
        AND b."createdAt" >= ${fiveMinsAgo}
        AND br."id" IS NULL
        AND ST_DWithin(
          ST_MakePoint(b."pickupLng", b."pickupLat"),
          ST_MakePoint(${currentLng}::float8, ${currentLat}::float8),
          5000
        )
      ORDER BY "distance" ASC
      LIMIT 20
    `;

    return NextResponse.json({ requests, currentBooking: null });
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
