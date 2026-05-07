import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bazars = await prisma.bazar.findMany({
      orderBy: { name: "asc" },
    });

    // Manually count drivers for each bazar since it's a string field
    const drivers = await prisma.driver.findMany({
      select: { nearbyBazar: true }
    });

    const bazarWithCounts = bazars.map(bazar => ({
      ...bazar,
      driverCount: drivers.filter(d => d.nearbyBazar === bazar.name).length
    }));

    return NextResponse.json(bazarWithCounts);
  } catch (error) {
    console.error("Fetch bazars error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch bazars", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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
    return NextResponse.json({ 
      error: "Failed to create bazar",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
