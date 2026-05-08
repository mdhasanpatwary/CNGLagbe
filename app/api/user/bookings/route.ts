import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || (session.role !== "USER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50); // cap at 50
    const skip = (page - 1) * limit;

    // Run findMany and count in parallel with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId: session.sub },
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
      prisma.booking.count({ where: { userId: session.sub } }),
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
