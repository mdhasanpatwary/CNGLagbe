import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const adminId = await getAuthenticatedAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 20) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ContributedDriverWhereInput = {};

    if (filter === "pending") {
      where.isApproved = false;
    } else if (filter === "approved") {
      where.isApproved = true;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { address: { contains: q, mode: "insensitive" } },
        { nearbyBazar: { contains: q, mode: "insensitive" } },
        { contributorName: { contains: q, mode: "insensitive" } },
        { contributorPhone: { contains: q } },
      ];
    }

    const [drivers, total, approvedCount, pendingCount, totalAll] = await Promise.all([
      prisma.contributedDriver.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.contributedDriver.count({ where }),
      prisma.contributedDriver.count({ where: { isApproved: true } }),
      prisma.contributedDriver.count({ where: { isApproved: false } }),
      prisma.contributedDriver.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      drivers,
      meta: {
        total,
        totalPages,
        approvedCount,
        pendingCount,
        totalAll,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Admin fetch contributed drivers error:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}
