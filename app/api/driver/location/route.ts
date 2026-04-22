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
