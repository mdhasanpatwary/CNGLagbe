import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { isBanglaText } from "@/lib/bazar-mapping";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // NOTE: syncContributedDriversBazars() was removed from the hot path.
    // It runs N+1 updates and re-executes on every serverless cold start.
    // Trigger it via admin action or cron instead.
    const { searchParams } = new URL(request.url);
    const includeUnapproved = searchParams.get("all") === "true";

    // Only return approved bazars for public views. Admin views get all bazars.
    const where = includeUnapproved ? {} : { isApproved: true };

    const driverCountWhere: Prisma.ContributedDriverWhereInput = {
      nearbyBazar: { not: null },
      ...(includeUnapproved ? {} : { isApproved: true }),
    };

    // Run both queries in parallel: bazars list + driver counts grouped by bazar
    const [bazars, driverCounts] = await Promise.all([
      prisma.bazar.findMany({
        where,
        orderBy: { name: "asc" },
      }),
      prisma.contributedDriver.groupBy({
        by: ["nearbyBazar"],
        where: driverCountWhere,
        _count: { _all: true },
      }),
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
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const trimmedName = name.trim();
    if (!isBanglaText(trimmedName)) {
      return NextResponse.json({ error: "BAZAR_NAME_MUST_BE_BANGLA" }, { status: 400 });
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
