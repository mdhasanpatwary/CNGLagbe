import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const onlineDriversCount = await prisma.driver.count({
      where: { isOnline: true }
    });

    // MVP mock logic: Return actual online count or a mocked baseline if 0 for UX
    const nearbyCount = onlineDriversCount > 0 ? onlineDriversCount : 3;

    return NextResponse.json({ nearby: nearbyCount });
  } catch (error) {
    console.error("Nearby Drivers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
