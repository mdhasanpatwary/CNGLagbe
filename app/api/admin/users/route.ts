import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "ALL";

    const whereClause: Prisma.UserWhereInput = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role && role !== "ALL") {
      whereClause.role = role;
    }

    // Run findMany and count in parallel instead of sequentially
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { bookings: true }
          }
        }
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        bookingCount: u._count.bookings,
        createdAt: u.createdAt
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin Users List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
