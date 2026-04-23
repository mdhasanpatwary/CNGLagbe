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

// Simple in-memory cache for driver requests
const requestsCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 3000; // 3 seconds

export async function GET() {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check Cache
    const cached = requestsCache.get(driverId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
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
      const responseData = {
        requests: [],
        currentBooking: activeBookings[0],
      };
      requestsCache.set(driverId, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

    if (currentLat == null || currentLng == null) {
      return NextResponse.json({ requests: [], currentBooking: null });
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Optimized geospatial query: Use ST_DWithin for index-based filtering
    const rawRequests: Array<{
      id: string;
      pickupLat: number;
      pickupLng: number;
      destLat: number;
      destLng: number;
      distance: number;
      fare: number;
      pickupAddress?: string;
      destAddress?: string;
      createdAt: Date;
      calculatedDistance: number;
    }> = await prisma.$queryRaw`
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
        ) / 1000 AS "calculatedDistance"
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
      ORDER BY "calculatedDistance" ASC
      LIMIT 20
    `;

    // Map calculated distance to distance field for response
    const requests: RequestItem[] = rawRequests.map(r => ({
      id: r.id,
      pickupLat: r.pickupLat,
      pickupLng: r.pickupLng,
      destLat: r.destLat,
      destLng: r.destLng,
      distance: r.calculatedDistance,
      fare: r.fare,
      pickupAddress: r.pickupAddress,
      destAddress: r.destAddress,
      createdAt: r.createdAt.toISOString(),
    }));

    const responseData = { requests, currentBooking: null };
    requestsCache.set(driverId, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
