import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// Simple in-memory cache for sync responses to reduce DB load
// TTL is very short (2s) to ensure data is relatively fresh but prevents redundant hits in same second
const syncCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 2000; 

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userId = session.sub;
    
    // Check cache
    const cached = syncCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const responseData: Record<string, unknown> = {
      authenticated: true,
      role: session.role,
      timestamp: Date.now(),
    };

    if (session.role === "USER") {
      // 1. Get User Data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, photoUrl: true }
      });

      // 2. Get Active Booking
      const activeBooking = await prisma.booking.findFirst({
        where: {
          userId,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        select: {
          id: true,
          status: true,
          fare: true,
          createdAt: true,
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              photoUrl: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      responseData.user = user;
      responseData.activeBooking = activeBooking;

    } else if (session.role === "DRIVER") {
      // 1. Get Driver Data and Stats in single query
      const driver = await prisma.driver.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          name: true, 
          photoUrl: true, 
          isOnline: true, 
          isApproved: true,
          currentLat: true,
          currentLng: true,
        }
      });

      if (!driver) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      // 2. Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use aggregation for stats (much faster than fetching all bookings)
      const stats = await prisma.booking.aggregate({
        where: {
          driverId: userId,
          status: "COMPLETED",
          createdAt: { gte: today },
        },
        _sum: { fare: true },
        _count: { id: true },
      });

      // 3. Get Current Booking or Nearby Requests
      const currentBooking = await prisma.booking.findFirst({
        where: {
          driverId: userId,
          status: "ACCEPTED",
        },
        select: {
          id: true,
          pickupLat: true,
          pickupLng: true,
          destLat: true,
          destLng: true,
          pickupAddress: true,
          destAddress: true,
          fare: true,
          distance: true,
        }
      });

      let requests: unknown[] = [];
      if (!currentBooking && driver.isOnline && driver.isApproved && driver.currentLat && driver.currentLng) {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Bounding box for 5km (~0.045 degrees) to use B-Tree index
        const latDelta = 0.045;
        const lngDelta = 0.045;
        const minLat = driver.currentLat - latDelta;
        const maxLat = driver.currentLat + latDelta;
        const minLng = driver.currentLng - lngDelta;
        const maxLng = driver.currentLng + lngDelta;

        // Optimized geospatial query with bounding box pre-filter
        requests = await prisma.$queryRaw`
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
              ST_MakePoint(${driver.currentLng}::float8, ${driver.currentLat}::float8)
            ) / 1000 AS "calculatedDistance"
          FROM "Booking" b
          LEFT JOIN "BookingRejection" br ON br."bookingId" = b."id" AND br."driverId" = ${userId}
          WHERE
            b."status" = 'PENDING'
            AND b."createdAt" >= ${fiveMinsAgo}
            AND b."pickupLat" BETWEEN ${minLat} AND ${maxLat}
            AND b."pickupLng" BETWEEN ${minLng} AND ${maxLng}
            AND br."id" IS NULL
            AND ST_DWithin(
              ST_MakePoint(b."pickupLng", b."pickupLat"),
              ST_MakePoint(${driver.currentLng}::float8, ${driver.currentLat}::float8),
              5000
            )
          ORDER BY "calculatedDistance" ASC
          LIMIT 10
        `;
      }

      responseData.driver = driver;
      responseData.stats = {
        todayEarnings: stats._sum.fare || 0,
        todayRides: stats._count.id || 0,
      };
      responseData.currentBooking = currentBooking;
      responseData.requests = requests;
    }

    // Update cache
    syncCache.set(userId, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
