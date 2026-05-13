import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { feedback } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        offlineFeedback: feedback,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Offline Feedback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
