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

    const whereClause: Prisma.WaitlistWhereInput = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role && role !== "ALL") {
      whereClause.role = role;
    }

    const [waitlist, total, driverCount, passengerCount] = await Promise.all([
      prisma.waitlist.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.waitlist.count({ where: whereClause }),
      prisma.waitlist.count({ where: { role: "DRIVER" } }),
      prisma.waitlist.count({ where: { role: "USER" } }),
    ]);

    return NextResponse.json({
      waitlist,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        driverCount,
        passengerCount,
      }
    });
  } catch (error) {
    console.error("Admin Waitlist List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
