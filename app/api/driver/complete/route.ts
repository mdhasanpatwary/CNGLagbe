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

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    
    if (booking.driverId !== payload.sub) {
       return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
    }

    if (booking.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Booking must be ACCEPTED to complete" }, { status: 400 });
    }

    const result = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ booking: result });
  } catch (error) {
    console.error("Driver Complete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
