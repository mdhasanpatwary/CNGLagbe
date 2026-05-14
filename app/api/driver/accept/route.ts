import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";
import { withIdempotency } from "@/lib/idempotency";
import { broadcastStatusChange } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withIdempotency(request, driverId, async () => {
      const { bookingId } = await request.json();
      if (!bookingId) {
        return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
      }

      // Use transaction to ensure no race conditions where 2 drivers accept the same booking
      const result = await prisma.$transaction(async (tx) => {
        // 1. Lock the Driver row to prevent this driver from parallel accepting multiple bookings
        await tx.$queryRaw`SELECT id FROM "Driver" WHERE id = ${driverId} FOR UPDATE`;

        const activeBooking = await tx.booking.findFirst({
          where: { driverId, status: "ACCEPTED" }
        });
        if (activeBooking) {
          throw new Error("Driver already has an active booking");
        }

        // 2. Lock the specific Booking row to prevent multiple drivers from grabbing it
        const bookings = await tx.$queryRaw<Array<{id: string, status: string}>>`
          SELECT id, status FROM "Booking" WHERE id = ${bookingId} FOR UPDATE
        `;
        if (!bookings || bookings.length === 0) throw new Error("Booking not found");
        if (bookings[0].status !== "PENDING") throw new Error("Booking already accepted or cancelled");

        // 3. Set driver offline
        await tx.driver.update({
          where: { id: driverId },
          data: { isOnline: false }
        });

        // 4. Update booking
        return await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "ACCEPTED",
            driverId,
            acceptedAt: new Date(),
          },
        });
      });

      // Broadcast status change to user
      broadcastStatusChange(bookingId, "ACCEPTED");

      return NextResponse.json({ booking: result });
    });
  } catch (error: unknown) {
    console.error("Driver Accept Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Booking already accepted or cancelled") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
