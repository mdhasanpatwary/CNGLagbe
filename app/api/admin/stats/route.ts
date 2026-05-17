import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Single raw SQL for all booking stats via conditional aggregation,
    // plus a parallel driver count (separate table).
    const [bookingStats, activeDrivers, offlineDrivers, onRideDrivers] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          totalBookings: bigint;
          completedBookings: bigint;
          cancelledBookings: bigint;
          timedOutBookings: bigint;
          pendingBookings: bigint;
          acceptedBookings: bigint;
          totalRevenue: number | null;
          voidedAmount: number | null;
          pendingActionBookings: bigint;
        }>
      >`
        SELECT
          COUNT(*)::bigint AS "totalBookings",
          COUNT(*) FILTER (WHERE status = 'COMPLETED')::bigint AS "completedBookings",
          COUNT(*) FILTER (WHERE status = 'CANCELLED')::bigint AS "cancelledBookings",
          COUNT(*) FILTER (WHERE status = 'TIMED_OUT')::bigint AS "timedOutBookings",
          COUNT(*) FILTER (WHERE status = 'PENDING')::bigint AS "pendingBookings",
          COUNT(*) FILTER (WHERE status = 'ACCEPTED')::bigint AS "acceptedBookings",
          COALESCE(SUM(fare) FILTER (WHERE status = 'COMPLETED'), 0) AS "totalRevenue",
          COALESCE(SUM(fare) FILTER (WHERE status IN ('CANCELLED', 'TIMED_OUT')), 0) AS "voidedAmount",
          COUNT(*) FILTER (WHERE status IN ('PENDING', 'TIMED_OUT', 'ASSIGNED'))::bigint AS "pendingActionBookings"
        FROM "Booking"
      `,
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.driver.count({ where: { isOnline: false, isApproved: true } }),
      prisma.booking.count({ where: { status: { in: ['ACCEPTED', 'ASSIGNED', 'PICKED_UP'] } } }),
    ]);

    const row = bookingStats[0];
    const totalRevenue = Number(row.totalRevenue) || 0;
    const adminCommission = totalRevenue * 0.20;
    const driverPayout = totalRevenue - adminCommission;

    return NextResponse.json({
      stats: {
        totalBookings: Number(row.totalBookings),
        completedBookings: Number(row.completedBookings),
        cancelledBookings: Number(row.cancelledBookings),
        timedOutBookings: Number(row.timedOutBookings),
        pendingBookings: Number(row.pendingBookings),
        acceptedBookings: Number(row.acceptedBookings),
        totalRevenue,
        voidedAmount: Number(row.voidedAmount) || 0,
        adminCommission,
        activeDrivers,
        offlineDrivers,
        onRideDrivers,
        revenue: {
          total: totalRevenue,
          voided: Number(row.voidedAmount) || 0,
          commission: adminCommission,
          driverPayout: driverPayout,
        },
        bookings: {
          pending: Number(row.pendingActionBookings),
        },
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
