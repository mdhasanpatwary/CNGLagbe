import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedDriver } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const driverId = await getApprovedDriver();

    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await request.json();

    if (lat == null || lng == null) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    // Single conditional UPDATE: only writes when driver is online AND coordinates
    // have actually changed. Eliminates the read-before-write round-trip.
    const result = await prisma.$executeRaw`
      UPDATE "Driver"
      SET "currentLat" = ${lat}::float8,
          "currentLng" = ${lng}::float8,
          "updatedAt" = NOW()
      WHERE "id" = ${driverId}
        AND "isOnline" = true
        AND (
          "currentLat" IS DISTINCT FROM ${lat}::float8
          OR "currentLng" IS DISTINCT FROM ${lng}::float8
        )
    `;

    return NextResponse.json({
      success: true,
      ...(result === 0 ? { skipped: "unchanged_or_offline" } : {}),
    });
  } catch (error) {
    console.error("Driver Location Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
