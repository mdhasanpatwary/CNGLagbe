import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userPhone: string | null = null;
    if (session.role === "USER" || session.role === "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { phone: true },
      });
      userPhone = user?.phone || null;
    } else if (session.role === "DRIVER") {
      const driver = await prisma.driver.findUnique({
        where: { id: session.sub },
        select: { phone: true },
      });
      userPhone = driver?.phone || null;
    }

    if (!userPhone) {
      return NextResponse.json({ error: "User phone not found" }, { status: 401 });
    }

    const drivers = await prisma.contributedDriver.findMany({
      where: { contributorPhone: userPhone },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      drivers,
      count: drivers.length,
    });
  } catch (error) {
    console.error("Fetch user contributed drivers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributed drivers" },
      { status: 500 }
    );
  }
}
