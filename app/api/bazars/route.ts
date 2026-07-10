import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Prisma } from "@prisma/client";
import { isBanglaText, mapEnglishToBanglaBazars } from "@/lib/bazar-mapping";

// Keep track of sync state globally (per container instance)
let hasSyncedContributedDrivers = false;

async function syncContributedDriversBazars() {
  if (hasSyncedContributedDrivers) return;
  
  try {
    // Fetch all bazars
    const bazars = await prisma.bazar.findMany({ select: { name: true } });
    const bazarNames = bazars.map(b => b.name);
    
    // Find all contributed drivers with non-null bazars
    const contributedDrivers = await prisma.contributedDriver.findMany({
      where: { nearbyBazar: { not: null } },
      select: { id: true, nearbyBazar: true }
    });
    
    for (const driver of contributedDrivers) {
      const currentBazar = driver.nearbyBazar;
      if (!currentBazar) continue;
      
      // If it's already an approved Bangla bazar name, skip
      if (bazarNames.includes(currentBazar)) continue;
      
      // Find matching Bangla bazar name
      const matchedBazars = mapEnglishToBanglaBazars(currentBazar, bazarNames);
      
      if (matchedBazars.length > 0) {
        await prisma.contributedDriver.update({
          where: { id: driver.id },
          data: { nearbyBazar: matchedBazars[0] }
        });
        console.log(`Synced contributed driver ${driver.id}: "${currentBazar}" -> "${matchedBazars[0]}"`);
      }
    }

    // Also sync official Driver table
    const drivers = await prisma.driver.findMany({
      where: { nearbyBazar: { not: null } },
      select: { id: true, nearbyBazar: true }
    });

    for (const d of drivers) {
      const currentBazar = d.nearbyBazar;
      if (!currentBazar) continue;

      if (bazarNames.includes(currentBazar)) continue;

      const matchedBazars = mapEnglishToBanglaBazars(currentBazar, bazarNames);

      if (matchedBazars.length > 0) {
        await prisma.driver.update({
          where: { id: d.id },
          data: { nearbyBazar: matchedBazars[0] }
        });
        console.log(`Synced driver ${d.id}: "${currentBazar}" -> "${matchedBazars[0]}"`);
      }
    }
    
    hasSyncedContributedDrivers = true;
  } catch (error) {
    console.error("Failed to sync contributed drivers bazars:", error);
  }
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return false;
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    await syncContributedDriversBazars();
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

    const isAdmin = await verifyAdmin();

    const bazar = await prisma.bazar.create({
      data: {
        name: trimmedName,
        isApproved: isAdmin // Approved by default for Admin, needs approval for public contributors
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
