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
      where: { id: bookingId },
      include: { driver: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (booking.driverId !== driverId) {
       return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    // In our new model, a booking can be COMPLETED directly from ACCEPTED when the driver arrives.
    if (booking.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Booking must be ACCEPTED to mark as arrived/completed" }, { status: 400 });
    }

    const result = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Broadcast status change to user
    // The user's UI should interpret "COMPLETED" as "Driver Arrived / Booking Done"
    broadcastStatusChange(bookingId, "COMPLETED");

    return NextResponse.json({ booking: result });
  } catch (error) {
    console.error("Driver Arrived Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
