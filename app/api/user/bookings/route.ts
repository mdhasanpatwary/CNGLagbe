import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type BookingStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || (session.role !== "USER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const status = searchParams.get("status");
    const timeframe = searchParams.get("timeframe") || "all";
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BookingWhereInput = {
      userId: session.sub,
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

    // Run findMany and count in parallel with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          fare: true,
          distance: true,
          pickupAddress: true,
          destAddress: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          driver: {
            select: {
              name: true,
              vehicleNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Booking History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
