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
    
    // Check if the driver already has an ACCEPTED ride
    const currentRide = await prisma.booking.findFirst({
      where: { 
        driverId: payload.sub,
        status: "ACCEPTED",
      },
    });

    if (currentRide) {
      return NextResponse.json({ 
        requests: [], 
        currentRide 
      });
    }

    const requests = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        createdAt: { gte: fifteenMinsAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests, currentRide: null });
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
