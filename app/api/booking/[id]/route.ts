import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "PENDING") {
      const timeoutThreshold = getBookingRequestTimeoutThreshold();
      if (booking.createdAt < timeoutThreshold) {
        // Auto-expire when request timeout is reached
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "TIMED_OUT" },
        }).catch(console.error);
        
        booking.status = "TIMED_OUT";
      }
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
