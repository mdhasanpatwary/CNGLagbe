import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { isBanglaText } from "@/lib/bazar-mapping";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnapproved = searchParams.get("all") === "true";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const isPaginatedCall = pageParam !== null || limitParam !== null || search !== "" || filter !== "all";

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 20) : (isPaginatedCall ? 20 : undefined);
    const skip = limit ? (page - 1) * limit : undefined;

    // Build Prisma filter for bazars
    const where: Prisma.BazarWhereInput = {};

    if (!includeUnapproved) {
      where.isApproved = true;
    } else {
      if (filter === "pending") {
        where.isApproved = false;
      } else if (filter === "approved") {
        where.isApproved = true;
      }
    }

    if (search.trim()) {
      where.name = { contains: search.trim(), mode: "insensitive" };
    }

    const driverCountWhere: Prisma.ContributedDriverWhereInput = {
      nearbyBazar: { not: null },
      ...(includeUnapproved ? {} : { isApproved: true }),
    };

    // Run queries in parallel: bazars list + driver counts + stats metadata
    const [bazars, driverCounts, total, approvedCount, pendingCount, totalAll] = await Promise.all([
      prisma.bazar.findMany({
        where,
        orderBy: { name: "asc" },
        ...(limit ? { take: limit } : {}),
        ...(skip ? { skip } : {}),
      }),
      prisma.contributedDriver.groupBy({
        by: ["nearbyBazar"],
        where: driverCountWhere,
        _count: { _all: true },
      }),
      prisma.bazar.count({ where }),
      prisma.bazar.count({ where: { isApproved: true } }),
      prisma.bazar.count({ where: { isApproved: false } }),
      prisma.bazar.count(),
    ]);

    // Build a lookup map: bazarName -> count
    const countMap = new Map<string, number>();
    for (const group of driverCounts) {
      if (group.nearbyBazar) {
        countMap.set(group.nearbyBazar, group._count._all);
      }
    }

    const bazarWithCounts = bazars.map((bazar) => ({
      ...bazar,
      driverCount: countMap.get(bazar.name) || 0,
    }));

    const headers: Record<string, string> = includeUnapproved
      ? { "Cache-Control": "no-store, max-age=0" }
      : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

    if (isPaginatedCall) {
      const activeLimit = limit || 20;
      const totalPages = Math.ceil(total / activeLimit);
      return NextResponse.json(
        {
          bazars: bazarWithCounts,
          meta: {
            total,
            totalPages,
            approvedCount,
            pendingCount,
            totalAll,
            page,
            limit: activeLimit,
          },
        },
        { headers }
      );
    }

    return NextResponse.json(bazarWithCounts, { headers });
  } catch (error) {
    console.error("Fetch bazars error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bazars",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, upazila, district } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const trimmedName = name.trim();
    if (!isBanglaText(trimmedName)) {
      return NextResponse.json({ error: "BAZAR_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }

    const trimmedUpazila = upazila && typeof upazila === "string" && upazila.trim() ? upazila.trim() : "ছাগলনাইয়া";
    const trimmedDistrict = district && typeof district === "string" && district.trim() ? district.trim() : "ফেনী";

    if (!isBanglaText(trimmedUpazila)) {
      return NextResponse.json({ error: "UPAZILA_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }

    if (!isBanglaText(trimmedDistrict)) {
      return NextResponse.json({ error: "DISTRICT_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }

    // Check if duplicate name exists
    const existing = await prisma.bazar.findUnique({
      where: { name: trimmedName }
    });

    if (existing) {
      return NextResponse.json({ error: "BAZAR_EXISTS" }, { status: 400 });
    }

    const session = await getAuthUser();
    const isAdmin = session?.role === "ADMIN";

    let createdByPhone: string | null = null;
    if (session) {
      if (session.role === "USER" || session.role === "ADMIN") {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.sub },
          select: { phone: true }
        });
        createdByPhone = dbUser?.phone || null;
      } else if (session.role === "DRIVER") {
        const dbDriver = await prisma.driver.findUnique({
          where: { id: session.sub },
          select: { phone: true }
        });
        createdByPhone = dbDriver?.phone || null;
      }
    }

    const bazar = await prisma.bazar.create({
      data: {
        name: trimmedName,
        upazila: trimmedUpazila,
        district: trimmedDistrict,
        isApproved: isAdmin, // Approved by default for Admin, needs approval for public contributors
        createdByPhone
      },
    });
    return NextResponse.json(bazar);
  } catch (error) {
    console.error("Create bazar error:", error);
    return NextResponse.json(
      {
        error: "Failed to create bazar",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
