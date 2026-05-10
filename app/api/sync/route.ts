import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { BoundedCache } from "@/lib/bounded-cache";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";

// BoundedCache prevents unbounded memory growth from accumulating unique user/driver IDs
const syncCache = new BoundedCache<Record<string, unknown>>(2000); // 2s TTL

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userId = session.sub;
    
    // Check cache (BoundedCache handles TTL internally)
    const cached = syncCache.get(userId);
    if (cached) {
      return NextResponse.json(cached);
    }

    const responseData: Record<string, unknown> = {
      authenticated: true,
      role: session.role,
      timestamp: Date.now(),
    };

    if (session.role === "USER" || session.role === "ADMIN") {
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

      // 2. Fetch stats, current booking, and nearby requests in parallel
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statsPromise = prisma.booking.aggregate({
        where: {
          driverId: userId,
          status: "COMPLETED",
          createdAt: { gte: today },
        },
        _sum: { fare: true },
        _count: { id: true },
      });

      const currentBookingPromise = prisma.booking.findFirst({
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
          polyline: true,
        }
      });

      let requestsPromise: Promise<unknown[]> = Promise.resolve([]);
      if (driver.isOnline && driver.isApproved && driver.currentLat && driver.currentLng) {
        const timeoutThreshold = getBookingRequestTimeoutThreshold();
        
        // Bounding box for 3km (~0.027 degrees) to use B-Tree index
        const latDelta = 0.027;
        const lngDelta = 0.027;
        const minLat = driver.currentLat - latDelta;
        const maxLat = driver.currentLat + latDelta;
        const minLng = driver.currentLng - lngDelta;
        const maxLng = driver.currentLng + lngDelta;

        // Optimized geospatial query with bounding box pre-filter
        requestsPromise = prisma.$queryRaw`
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
            b."polyline",
            ST_DistanceSphere(
              ST_MakePoint(b."pickupLng", b."pickupLat"),
              ST_MakePoint(${driver.currentLng}::float8, ${driver.currentLat}::float8)
            ) / 1000 AS "calculatedDistance"
          FROM "Booking" b
          LEFT JOIN "BookingRejection" br ON br."bookingId" = b."id" AND br."driverId" = ${userId}
          WHERE
            b."status" = 'PENDING'
            AND b."createdAt" >= ${timeoutThreshold}
            AND b."pickupLat" BETWEEN ${minLat} AND ${maxLat}
            AND b."pickupLng" BETWEEN ${minLng} AND ${maxLng}
            AND br."id" IS NULL
            AND ST_DWithin(
              ST_MakePoint(b."pickupLng", b."pickupLat"),
              ST_MakePoint(${driver.currentLng}::float8, ${driver.currentLat}::float8),
              3000
            )
          ORDER BY "calculatedDistance" ASC
          LIMIT 10
        `;
      }

      const [stats, currentBooking, rawRequests] = await Promise.all([
        statsPromise,
        currentBookingPromise,
        requestsPromise
      ]);
      const requests = currentBooking ? [] : rawRequests;

      responseData.driver = driver;
      responseData.stats = {
        todayEarnings: stats._sum.fare || 0,
        todayBookings: stats._count.id || 0,
      };
      responseData.currentBooking = currentBooking;
      responseData.requests = requests;
    }

    // Update cache
    syncCache.set(userId, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
