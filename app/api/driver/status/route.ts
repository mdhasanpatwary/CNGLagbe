import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/auth";

export async function GET() {
  try {
    const driverId = await getAuthenticatedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, isOnline: true, isApproved: true, name: true }
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = await prisma.booking.findMany({
      where: {
        driverId,
        status: "COMPLETED",
        createdAt: {
          gte: today,
        },
      },
      select: {
        fare: true,
      },
    });

    const todayEarnings = todayBookings.reduce((sum, b) => sum + b.fare, 0);
    const todayRides = todayBookings.length;

    return NextResponse.json({ 
      driver,
      stats: {
        todayEarnings,
        todayRides
      }
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

    // Check if approved before allowing online status
    const currentDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { isApproved: true }
    });

    const { isOnline } = await request.json();

    if (isOnline && !currentDriver?.isApproved) {
      return NextResponse.json({ error: "Unauthorized: Driver not approved" }, { status: 403 });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isOnline: Boolean(isOnline) },
    });

    return NextResponse.json({ driver: { id: driver.id, isOnline: driver.isOnline, isApproved: driver.isApproved } });
  } catch (error) {
    console.error("Driver Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
