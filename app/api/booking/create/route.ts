import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateFare } from "@/lib/fare";
import { withIdempotency } from "@/lib/idempotency";
import { getBoundingBox } from "@/lib/radius";
import { messagingAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "USER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withIdempotency(request, user.sub, async () => {
      const body = await request.json();
      const { 
        pickupLat, pickupLng, destLat, destLng, 
        pickupAddress, destAddress, polyline,
        distance
      } = body;

      // --- Cancellation Rate Limit Check ---
      // Use count() instead of findMany to avoid fetching full booking records
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const cancelCount = await prisma.booking.count({
        where: {
          userId: user.sub,
          status: "CANCELLED",
          cancelledBy: "USER",
          cancelledAt: { gte: hourAgo },
        },
      });

      if (cancelCount >= 3) {
        // Only fetch the timestamp when actually rate-limited
        const lastCancel = await prisma.booking.findFirst({
          where: {
            userId: user.sub,
            status: "CANCELLED",
            cancelledBy: "USER",
            cancelledAt: { gte: hourAgo },
          },
          orderBy: { cancelledAt: "desc" },
          select: { cancelledAt: true },
        });

        if (lastCancel?.cancelledAt) {
          const cooldownMs = 30 * 1000 * 60;
          const remainingMs = cooldownMs - (Date.now() - lastCancel.cancelledAt.getTime());
          if (remainingMs > 0) {
            return NextResponse.json(
              { 
                error: "CANCEL_COOLDOWN", 
                message: "Limit reached. Wait 30 mins.",
                remainingMinutes: Math.ceil(remainingMs / (60 * 1000))
              }, 
              { status: 429 }
            );
          }
        }
      }
      // -------------------------------------
      
      if (!pickupLat || !pickupLng || !destLat || !destLng) {
        return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
      }

      if (distance === undefined || distance === null || typeof distance !== "number" || distance <= 0) {
        return NextResponse.json(
          { 
            error: "Missing road distance", 
            message: "Actual driving road distance is required for fare calculation." 
          }, 
          { status: 400 }
        );
      }

      // Fetch dynamic platform, rate, radius, and balance settings in parallel
      const [feeSetting, rateSetting, searchRadiusSetting, minBalanceSetting] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: "PLATFORM_FEE_PERCENTAGE" } }),
        prisma.systemSetting.findUnique({ where: { key: "CNG_PER_KM_RATE" } }),
        prisma.systemSetting.findUnique({ where: { key: "DRIVER_SEARCH_RADIUS_KM" } }),
        prisma.systemSetting.findUnique({ where: { key: "MIN_DRIVER_BALANCE" } }),
      ]);

      const platformFeePercentage = feeSetting ? Number(feeSetting.value) : 5;
      const perKmRate = rateSetting ? Number(rateSetting.value) : 20;
      const searchRadiusKm = searchRadiusSetting ? parseFloat(searchRadiusSetting.value) : 3;
      const minBalance = minBalanceSetting ? parseFloat(minBalanceSetting.value) : -100;

      const fare = calculateFare(distance, platformFeePercentage, perKmRate);

      const result = await prisma.$transaction(async (tx) => {
        // Row-level lock on the User to prevent double-booking race condition
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.sub} FOR UPDATE`;

        // Check for active bookings (PENDING or ACCEPTED)
        const activeBooking = await tx.booking.findFirst({
          where: {
            userId: user.sub,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
        });

        if (activeBooking) {
          throw new Error(`Active booking already exists:${activeBooking.id}`);
        }

        return await tx.booking.create({
          data: {
            pickupLat: Number(pickupLat),
            pickupLng: Number(pickupLng),
            destLat: Number(destLat),
            destLng: Number(destLng),
            pickupAddress,
            destAddress,
            polyline,
            distance,
            fare: fare.totalFare, // Total amount for compatibility
            baseFare: fare.fare,
            platformFee: fare.platformFee,
            totalFare: fare.totalFare,
            userId: user.sub,
            status: "PENDING",
          },
        });
      });

      // Send push notifications to nearby drivers
      // MUST be awaited — Next.js kills un-awaited promises after the response is sent
      try {
        const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
          Number(pickupLat),
          Number(pickupLng),
          searchRadiusKm
        );

        const nearbyDrivers = await prisma.$queryRaw<{ id: string; pushToken: string }[]>`
          SELECT 
            d."id",
            pt."token" AS "pushToken"
          FROM "Driver" d
          LEFT JOIN "DriverWallet" w ON w."driverId" = d."id"
          LEFT JOIN "DriverPushToken" pt ON pt."driverId" = d."id"
          WHERE 
            d."isOnline" = true
            AND d."isApproved" = true
            AND d."isSuspended" = false
            AND d."currentLat" BETWEEN ${minLat} AND ${maxLat}
            AND d."currentLng" BETWEEN ${minLng} AND ${maxLng}
            AND pt."token" IS NOT NULL
            AND (w."balance" IS NULL OR w."balance" > ${minBalance})
            AND NOT EXISTS (
              SELECT 1 FROM "Booking" b 
              WHERE b."driverId" = d."id" 
                AND b."status" IN ('ACCEPTED', 'ARRIVED', 'PICKED_UP')
            )
            AND ST_DWithin(
              ST_MakePoint(d."currentLng", d."currentLat")::geography,
              ST_MakePoint(${Number(pickupLng)}::float8, ${Number(pickupLat)}::float8)::geography,
              ${searchRadiusKm * 1000}::float8
            )
        `;

        const pushTokens = nearbyDrivers
          .map((d) => d.pushToken)
          .filter((t): t is string => !!t);

        if (pushTokens.length > 0 && messagingAdmin) {
          const message = {
            notification: {
              title: "নতুন রাইড রিকুয়েস্ট! 🛺",
              body: `ভাড়া: ${fare.totalFare} BDT | দূরত্ব: ${distance.toFixed(1)} KM`,
            },
            data: {
              bookingId: result.id,
              pickupAddress: pickupAddress || "",
              destAddress: destAddress || "",
            },
            tokens: pushTokens,
          };

          const response = await messagingAdmin.sendEachForMulticast(message);
          console.log(`Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`);
        }
      } catch (broadcastError) {
        // Silent catch — never block the booking response for a push failure
        console.error("FCM broadcast error:", broadcastError);
      }

      return NextResponse.json({ booking: result });
    });
  } catch (error: unknown) {
    console.error("Booking Create Error:", error);
    const err = error as { message?: string };
    if (err.message?.startsWith("Active booking already exists:")) {
      return NextResponse.json(
        { error: "Active booking already exists", bookingId: err.message.split(":")[1] },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
