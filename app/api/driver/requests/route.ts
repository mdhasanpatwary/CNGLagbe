import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";

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

import { BoundedCache } from "@/lib/bounded-cache";

// BoundedCache prevents unbounded memory growth from accumulating unique driver IDs
const requestsCache = new BoundedCache<Record<string, unknown>>(3000); // 3s TTL

export async function GET() {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check Cache (BoundedCache handles TTL internally)
    const cached = requestsCache.get(driverId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get driver location, active booking, and wallet in single query
    const driverWithActiveBooking = await prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        currentLat: true,
        currentLng: true,
        wallet: { select: { balance: true } },
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
      requestsCache.set(driverId, responseData);
      return NextResponse.json(responseData);
    }

    // Check wallet balance
    const minBalanceSetting = await prisma.systemSetting.findUnique({
      where: { key: "MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS" }
    });
    const minBalance = minBalanceSetting ? parseFloat(minBalanceSetting.value) : -100;

    const walletBalance = driverWithActiveBooking.wallet?.balance || 0;
    if (walletBalance <= minBalance) {
      const responseData = { requests: [], currentBooking: null, isWalletSuspended: true };
      requestsCache.set(driverId, responseData);
      return NextResponse.json(responseData);
    }

    if (currentLat == null || currentLng == null) {
      return NextResponse.json({ requests: [], currentBooking: null });
    }

    const timeoutThreshold = getBookingRequestTimeoutThreshold();

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
        AND b."createdAt" >= ${timeoutThreshold}
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
    requestsCache.set(driverId, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
