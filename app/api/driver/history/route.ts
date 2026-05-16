import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BookingStatus } from "@/lib/types/booking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || (session.role !== "DRIVER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const status = searchParams.get("status"); // COMPLETED or CANCELLED
    const timeframe = searchParams.get("timeframe") || "all";
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BookingWhereInput = {
      driverId: session.sub,
      status: status ? (status as BookingStatus) : { in: ["COMPLETED", "CANCELLED"] as BookingStatus[] },
    };

    if (timeframe !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (timeframe === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        start.setDate(now.getDate() - 7);
      } else if (timeframe === "monthly") {
        start.setDate(now.getDate() - 30);
      }
      whereClause.createdAt = { gte: start };
    }

    const [bookings, totalFiltered, stats] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          fare: true,
          baseFare: true,
          platformFee: true,
          totalFare: true,
          distance: true,
          pickupAddress: true,
          destAddress: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          rating: true,
          feedback: true,
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: whereClause }),
      // Fetch all-time stats for the summary cards
      prisma.booking.aggregate({
        where: {
          driverId: session.sub,
          status: "COMPLETED",
        },
        _sum: {
          totalFare: true,
          fare: true,
        },
        _count: {
          id: true,
          rating: true,
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return NextResponse.json({
      bookings,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
        stats: {
          lifetimeTrips: stats._count.id,
          totalEarned: (stats._sum.totalFare || stats._sum.fare || 0),
          avgRating: stats._avg.rating || 0,
          ratingCount: stats._count.rating || 0,
        }
      },
    });
  } catch (error) {
    console.error("Driver History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
