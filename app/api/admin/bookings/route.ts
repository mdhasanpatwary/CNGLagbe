import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const type = searchParams.get("type");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const andConditions: Prisma.BookingWhereInput[] = [];

    if (type === "active") {
      andConditions.push({ status: { in: ["PENDING", "ACCEPTED", "ASSIGNED"] } });
    } else if (statusFilter && statusFilter !== "ALL") {
      andConditions.push({ status: statusFilter });
    }

    if (search) {
      andConditions.push({
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { pickupAddress: { contains: search, mode: "insensitive" } },
          { destAddress: { contains: search, mode: "insensitive" } },
          {
            driver: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } }
              ]
            }
          },
          {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } }
              ]
            }
          }
        ]
      });
    }

    const whereClause: Prisma.BookingWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    // Run findMany and count in parallel instead of sequentially
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          driver: { select: { name: true, phone: true } },
          user: { select: { name: true, phone: true } }
        },
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
    console.error("Admin Bookings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
