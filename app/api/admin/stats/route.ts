import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalBookings = await prisma.booking.count();
    
    const completedBookingsResponse = await prisma.booking.aggregate({
      where: { status: "COMPLETED" },
      _count: true,
      _sum: {
        fare: true,
      }
    });

    const completedBookings = completedBookingsResponse._count;
    const totalRevenue = completedBookingsResponse._sum.fare || 0;
    const adminCommission = totalRevenue * 0.20; // 20% commission
    const driverPayout = totalRevenue - adminCommission;

    const activeDrivers = await prisma.driver.count({
      where: { isOnline: true }
    });

    const pendingBookings = await prisma.booking.count({
      where: { status: "PENDING" }
    });

    return NextResponse.json({
      stats: {
        totalBookings,
        completedBookings,
        totalRevenue,
        adminCommission,
        activeDrivers,
        revenue: {
          total: totalRevenue,
          commission: adminCommission,
          driverPayout: driverPayout
        },
        bookings: {
          pending: pendingBookings
        }
      }
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
