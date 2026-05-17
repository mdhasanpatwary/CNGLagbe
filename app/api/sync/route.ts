import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { BoundedCache } from "@/lib/bounded-cache";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";
import { getBoundingBox } from "@/lib/radius";

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
              averageRating: true,
              ratingCount: true,
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

      const lifetimeStatsPromise = prisma.booking.aggregate({
        where: {
          driverId: userId,
          status: "COMPLETED",
        },
        _sum: { fare: true },
        _count: { id: true, rating: true },
        _avg: { rating: true },
      });

      const currentBookingPromise = prisma.booking.findFirst({
        where: {
          driverId: userId,
          status: { in: ["ACCEPTED", "PICKED_UP"] },
        },
        select: {
          id: true,
          status: true,
          pickupLat: true,
          pickupLng: true,
          destLat: true,
          destLng: true,
          pickupAddress: true,
          destAddress: true,
          fare: true,
          baseFare: true,
          platformFee: true,
          totalFare: true,
          distance: true,
          polyline: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            }
          }
        }
      });

      const walletPromise = prisma.driverWallet.findUnique({
        where: { driverId: userId },
        select: { balance: true }
      });

      const minBalanceSettingPromise = prisma.systemSetting.findUnique({
        where: { key: "MIN_WALLET_BALANCE_FOR_RIDE_REQUESTS" }
      });

      const searchRadiusSettingPromise = prisma.systemSetting.findUnique({
        where: { key: "DRIVER_SEARCH_RADIUS_KM" }
      });

      const [stats, lifetimeStats, currentBooking, wallet, minBalanceSetting, searchRadiusSetting] = await Promise.all([
        statsPromise,
        lifetimeStatsPromise,
        currentBookingPromise,
        walletPromise,
        minBalanceSettingPromise,
        searchRadiusSettingPromise
      ]);

      const minBalance = minBalanceSetting ? parseFloat(minBalanceSetting.value) : -100;
      const isWalletSuspended = (wallet?.balance || 0) <= minBalance;
      const searchRadiusKm = searchRadiusSetting ? parseFloat(searchRadiusSetting.value) : 3;

      let requestsPromise: Promise<unknown[]> = Promise.resolve([]);
      if (driver.isOnline && driver.isApproved && driver.currentLat && driver.currentLng && !isWalletSuspended) {
        const timeoutThreshold = getBookingRequestTimeoutThreshold();

        // Dynamically compute bounding box using the search radius setting
        const { minLat, maxLat, minLng, maxLng } = getBoundingBox(driver.currentLat, driver.currentLng, searchRadiusKm);

        // Optimized geospatial query with bounding box pre-filter and dynamic search radius setting
        requestsPromise = prisma.$queryRaw`
          SELECT
            b."id",
            b."pickupLat",
            b."pickupLng",
            b."destLat",
            b."destLng",
            b."distance",
            b."fare",
            b."baseFare",
            b."platformFee",
            b."totalFare",
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
              ${searchRadiusKm * 1000}::float8
            )
          ORDER BY "calculatedDistance" ASC
          LIMIT 10
        `;
      }

      const rawRequests = await requestsPromise;
      const requests = currentBooking ? [] : rawRequests;

      responseData.driver = { ...driver, wallet, role: "DRIVER" };
      responseData.stats = {
        todayEarnings: stats._sum.fare || 0,
        todayBookings: stats._count.id || 0,
        totalEarnings: lifetimeStats._sum.fare || 0,
        totalBookings: lifetimeStats._count.id || 0,
        totalRatings: lifetimeStats._count.rating || 0,
        avgRating: lifetimeStats._avg.rating || 0,
      };
      responseData.currentBooking = currentBooking;
      responseData.requests = requests;
      responseData.isWalletSuspended = isWalletSuspended;
    }

    // Update cache
    syncCache.set(userId, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
