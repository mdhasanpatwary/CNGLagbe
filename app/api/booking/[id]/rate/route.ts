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
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Rating Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
