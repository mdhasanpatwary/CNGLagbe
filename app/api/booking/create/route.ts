import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateDistance, calculateFare } from "@/lib/fare";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withIdempotency(request, user.sub, async () => {
      const body = await request.json();
      const { 
        pickupLat, pickupLng, destLat, destLng, 
        pickupAddress, destAddress, polyline
      } = body;

      // --- Cancellation Rate Limit Check ---
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCancels = await prisma.booking.findMany({
        where: {
          userId: user.sub,
          status: "CANCELLED",
          cancelledBy: "USER",
          cancelledAt: { gte: hourAgo },
        },
        orderBy: { cancelledAt: "desc" },
        take: 3,
      });

      if (recentCancels.length >= 3) {
        const lastCancel = recentCancels[0].cancelledAt;
        if (lastCancel) {
          const cooldownMs = 30 * 1000 * 60;
          const remainingMs = cooldownMs - (Date.now() - lastCancel.getTime());
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
      const distance = calculateDistance(
        Number(pickupLat),
        Number(pickupLng),
        Number(destLat),
        Number(destLng)
      );

      const fare = calculateFare(distance);

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
            fare,
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
