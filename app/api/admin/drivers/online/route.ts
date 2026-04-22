import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
