import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
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

    // Find bookings that are PENDING and created in the last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Run both queries concurrently to reduce latency
    const [activeBooking, pendingRequests] = await Promise.all([
      prisma.booking.findFirst({
        where: {
          driverId: payload.sub,
          status: "ACCEPTED",
        },
      }),
      prisma.booking.findMany({
        where: {
          status: "PENDING",
          createdAt: { gte: fifteenMinsAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    if (activeBooking) {
      return NextResponse.json({
        requests: [],
        currentBooking: activeBooking,
      });
    }

    const requests = pendingRequests;

    return NextResponse.json({ requests, currentBooking: null });
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
