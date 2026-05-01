import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drivers = await prisma.driver.findMany({
      where: { isOnline: true },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleNumber: true,
        currentLat: true,
        currentLng: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Admin Online Drivers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
