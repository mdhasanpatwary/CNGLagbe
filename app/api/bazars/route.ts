import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Run both queries in parallel: bazars list + driver counts grouped by bazar
    const [bazars, driverCounts] = await Promise.all([
      prisma.bazar.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.driver.groupBy({
        by: ["nearbyBazar"],
        where: { nearbyBazar: { not: null } },
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

    return NextResponse.json(bazarWithCounts);
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

    const bazar = await prisma.bazar.create({
      data: { name },
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
