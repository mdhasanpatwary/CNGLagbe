import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { mapEnglishToBanglaBazars } from "@/lib/bazar-mapping";

/**
 * Admin-only endpoint to sync contributed driver bazar names.
 * Migrated from the public GET /api/bazars hot path where it was
 * causing 2-5s cold-start delays on every serverless invocation.
 */
export async function POST() {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bazars = await prisma.bazar.findMany({ select: { name: true } });
    const bazarNames = bazars.map(b => b.name);

    let syncedCount = 0;

    // Sync ContributedDriver table
    const contributedDrivers = await prisma.contributedDriver.findMany({
      where: { nearbyBazar: { not: null } },
      select: { id: true, nearbyBazar: true }
    });

    for (const driver of contributedDrivers) {
      const currentBazar = driver.nearbyBazar;
      if (!currentBazar || bazarNames.includes(currentBazar)) continue;

      const matchedBazars = mapEnglishToBanglaBazars(currentBazar, bazarNames);
      if (matchedBazars.length > 0) {
        await prisma.contributedDriver.update({
          where: { id: driver.id },
          data: { nearbyBazar: matchedBazars[0] }
        });
        syncedCount++;
      }
    }

    // Sync official Driver table
    const drivers = await prisma.driver.findMany({
      where: { nearbyBazar: { not: null } },
      select: { id: true, nearbyBazar: true }
    });

    for (const d of drivers) {
      const currentBazar = d.nearbyBazar;
      if (!currentBazar || bazarNames.includes(currentBazar)) continue;

      const matchedBazars = mapEnglishToBanglaBazars(currentBazar, bazarNames);
      if (matchedBazars.length > 0) {
        await prisma.driver.update({
          where: { id: d.id },
          data: { nearbyBazar: matchedBazars[0] }
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, syncedCount });
  } catch (error) {
    console.error("Sync bazars error:", error);
    return NextResponse.json({ error: "Failed to sync bazars" }, { status: 500 });
  }
}
