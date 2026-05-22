import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateDistance, calculateFare } from "@/lib/fare";
import { withIdempotency } from "@/lib/idempotency";

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
        distance: manualDistance
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

      // Calculate distance and fare strictly server-side based on immutable coordinates
      // or use manualDistance if provided (and valid)
      const distance = manualDistance !== undefined
        ? Number(manualDistance)
        : calculateDistance(
            Number(pickupLat),
            Number(pickupLng),
            Number(destLat),
            Number(destLng)
          );

      // Fetch dynamic platform fee setting
      const feeSetting = await prisma.systemSetting.findUnique({
        where: { key: "PLATFORM_FEE_PERCENTAGE" },
      });
      const platformFeePercentage = feeSetting ? Number(feeSetting.value) : 5;

      // Fetch dynamic CNG per KM rate setting
      const rateSetting = await prisma.systemSetting.findUnique({
        where: { key: "CNG_PER_KM_RATE" },
      });
      const perKmRate = rateSetting ? Number(rateSetting.value) : 20;

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
