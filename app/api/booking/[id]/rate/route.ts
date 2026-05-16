import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Updated to use new rating/feedback fields
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: p.id },
      data: {
        rating,
        feedback,
      },
      include: {
        driver: true
      }
    });

    if (booking.driverId) {
      // Recalculate driver ratings
      const ratedBookings = await prisma.booking.findMany({
        where: {
          driverId: booking.driverId,
          rating: { not: null }
        },
        select: { rating: true }
      });

      const count = ratedBookings.length;
      const avg = ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / count;

      await prisma.driver.update({
        where: { id: booking.driverId },
        data: {
          averageRating: avg,
          ratingCount: count
        }
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Rating Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
