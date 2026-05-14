import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";
import { broadcastStatusChange } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (booking.driverId !== driverId) {
       return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    if (booking.status !== "PICKED_UP") {
      return NextResponse.json({ error: "Booking must be in progress (PICKED_UP) to complete" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await tx.driver.updateMany({
        where: {
          id: driverId,
          isSuspended: false
        },
        data: { isOnline: true }
      });

      return bookingUpdate;
    });

    // Broadcast status change to user
    broadcastStatusChange(bookingId, "COMPLETED");

    return NextResponse.json({ booking: result });
  } catch (error) {
    console.error("Driver Complete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
