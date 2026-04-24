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

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, isOnline: true, currentLat: true, currentLng: true }
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (!driver.isOnline) {
      return NextResponse.json({ success: true, skipped: "offline" });
    }

    const sameLat = driver.currentLat != null && Math.abs(driver.currentLat - lat) < 0.000001;
    const sameLng = driver.currentLng != null && Math.abs(driver.currentLng - lng) < 0.000001;

    if (sameLat && sameLng) {
      return NextResponse.json({ success: true, skipped: "unchanged" });
    }

    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
      },
      select: { id: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Driver Location Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
