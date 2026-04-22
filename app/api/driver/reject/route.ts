import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";

// For MVP, rejecting just tells the client to hide the booking request locally 
// so we don't have to maintain an array of 'rejectedBy' driver IDs in the DB
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

    await prisma.bookingRejection.upsert({
      where: {
        bookingId_driverId: {
          bookingId,
          driverId,
        },
      },
      update: {},
      create: {
        bookingId,
        driverId,
      },
    });

    return NextResponse.json({ success: true, message: "Booking rejected" });
  } catch (error) {
    console.error("Driver Reject Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
