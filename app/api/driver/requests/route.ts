import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find bookings that are PENDING and created in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Fire-and-forget: expire old pending requests
    prisma.booking.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: fiveMinsAgo },
      },
      data: {
        status: "TIMED_OUT",
      },
    }).catch(console.error);

    // Get driver status and active booking concurrently
    const [driver, activeBooking] = await Promise.all([
      prisma.driver.findUnique({
        where: { id: driverId },
        select: { currentLat: true, currentLng: true },
      }),
      prisma.booking.findFirst({
        where: {
          driverId,
          status: "ACCEPTED",
        },
      }),
    ]);

    if (activeBooking) {
      return NextResponse.json({
        requests: [],
        currentBooking: activeBooking,
      });
    }

    let requests: any[] = [];
    if (driver?.currentLat != null && driver?.currentLng != null) {
      // Geospatial search using PostGIS raw SQL
      // find online, available drivers within close radius (5km).
      requests = await prisma.$queryRaw`
        SELECT 
          b.*,
          ST_DistanceSphere(
            ST_MakePoint(b."pickupLng", b."pickupLat"),
            ST_MakePoint(${driver.currentLng}, ${driver.currentLat})
          ) / 1000 AS "calculatedDistance"
        FROM "Booking" b
        LEFT JOIN "BookingRejection" br ON br."bookingId" = b."id" AND br."driverId" = ${driverId}
        WHERE 
          b."status" = 'PENDING'
          AND b."createdAt" >= ${fiveMinsAgo}
          AND br."id" IS NULL
          AND ST_DistanceSphere(
            ST_MakePoint(b."pickupLng", b."pickupLat"),
            ST_MakePoint(${driver.currentLng}, ${driver.currentLat})
          ) <= 5000
        ORDER BY 
          ST_DistanceSphere(
            ST_MakePoint(b."pickupLng", b."pickupLat"),
            ST_MakePoint(${driver.currentLng}, ${driver.currentLat})
          ) ASC
        LIMIT 20
      `;
    }

    return NextResponse.json({ requests, currentBooking: null });
  } catch (error) {
    console.error("Driver Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
