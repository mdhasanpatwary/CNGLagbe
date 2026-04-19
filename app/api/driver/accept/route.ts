import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    // Use transaction to ensure no race conditions where 2 drivers accept the same ride
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }});
      
      if (!booking) throw new Error("Booking not found");
      if (booking.status !== "PENDING") throw new Error("Booking already accepted or cancelled");

      return await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "ACCEPTED",
          driverId: payload.sub,
        },
      });
    });

    return NextResponse.json({ booking: result });
  } catch (error: any) {
    console.error("Driver Accept Error:", error);
    if (error.message === "Booking already accepted or cancelled") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
