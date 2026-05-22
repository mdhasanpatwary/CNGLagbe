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

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (booking.driverId !== driverId) {
       return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    if (booking.status !== "ARRIVED") {
      return NextResponse.json({ error: "Booking must be ARRIVED to start the trip" }, { status: 400 });
    }

    const result = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: "PICKED_UP",
        startedAt: new Date(),
      },
    });

    // Broadcast status change to user
    broadcastStatusChange(bookingId, "PICKED_UP");

    return NextResponse.json({ booking: result });
  } catch (error) {
    console.error("Driver Start Trip Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
