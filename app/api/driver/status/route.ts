import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/auth";

export async function GET() {
  try {
    const driverId = await getAuthenticatedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run driver fetch and today's stats in parallel
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [driver, stats] = await Promise.all([
      prisma.driver.findUnique({
        where: { id: driverId },
        select: { id: true, isOnline: true, isApproved: true, name: true, photoUrl: true },
      }),
      prisma.booking.aggregate({
        where: {
          driverId,
          status: "COMPLETED",
          createdAt: { gte: today },
        },
        _sum: { fare: true },
        _count: { id: true },
      }),
    ]);

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({
      driver,
      stats: {
        todayEarnings: stats._sum.fare || 0,
        todayRides: stats._count.id || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const driverId = await getAuthenticatedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isOnline } = await request.json();
    const wantOnline = Boolean(isOnline);

    if (wantOnline) {
      // Single conditional UPDATE: only succeeds if driver is approved.
      // Eliminates the separate findUnique check.
      const result: number = await prisma.$executeRaw`
        UPDATE "Driver"
        SET "isOnline" = true, "updatedAt" = NOW()
        WHERE "id" = ${driverId} AND "isApproved" = true
      `;

      if (result === 0) {
        return NextResponse.json({ error: "Unauthorized: Driver not approved" }, { status: 403 });
      }

      return NextResponse.json({ driver: { id: driverId, isOnline: true, isApproved: true } });
    } else {
      // Going offline doesn't require approval check
      await prisma.driver.update({
        where: { id: driverId },
        data: { isOnline: false },
      });

      return NextResponse.json({ driver: { id: driverId, isOnline: false, isApproved: true } });
    }
  } catch (error) {
    console.error("Driver Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
