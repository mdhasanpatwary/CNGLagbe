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
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const userPhones = users.map(u => u.phone).filter(Boolean);
    const driverCounts = await prisma.contributedDriver.groupBy({
      by: ["contributorPhone", "vehicleType"],
      where: { contributorPhone: { in: userPhones } },
      _count: { _all: true }
    });

    return NextResponse.json({
      users: users.map(u => {
        const userCounts = driverCounts.filter(c => c.contributorPhone === u.phone);
        const cngCount = userCounts.find(c => c.vehicleType === "CNG")?._count._all || 0;
        const totoCount = userCounts.find(c => c.vehicleType === "TOTO")?._count._all || 0;
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          contributedDriversCount: cngCount + totoCount,
          contributedCngCount: cngCount,
          contributedTotoCount: totoCount,
          createdAt: u.createdAt
        };
      }),
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
