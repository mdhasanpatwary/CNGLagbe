import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";
import { getBookingTimeoutMinutes } from "@/lib/settings";

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
            averageRating: true,
            ratingCount: true,
          },
        },
        issueReports: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const timeoutMinutes = await getBookingTimeoutMinutes();

    if (booking.status === "PENDING") {
      const timeoutThreshold = getBookingRequestTimeoutThreshold(timeoutMinutes);
      if (booking.createdAt < timeoutThreshold) {
        // Auto-expire when request timeout is reached
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "TIMED_OUT" },
        }).catch(console.error);
        
        booking.status = "TIMED_OUT";
      }
    }

    return NextResponse.json({ booking, timeoutSeconds: timeoutMinutes * 60 });
  } catch (error) {
    console.error("Booking GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
