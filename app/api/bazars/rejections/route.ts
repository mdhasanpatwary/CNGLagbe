import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { contributedBazars } = await request.json();
    const localNames = Array.isArray(contributedBazars) ? contributedBazars : [];

    const session = await getAuthUser();
    let userPhone: string | null = null;

    if (session) {
      if (session.role === "USER" || session.role === "ADMIN") {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.sub },
          select: { phone: true }
        });
        userPhone = dbUser?.phone || null;
      } else if (session.role === "DRIVER") {
        const dbDriver = await prisma.driver.findUnique({
          where: { id: session.sub },
          select: { phone: true }
        });
        userPhone = dbDriver?.phone || null;
      }
    }

    const conditions = [];
    if (userPhone) {
      conditions.push({ userPhone });
    }
    if (localNames.length > 0) {
      conditions.push({ name: { in: localNames } });
    }

    if (conditions.length === 0) {
      return NextResponse.json({ rejections: [] });
    }

    const rejections = await prisma.bazarRejection.findMany({
      where: {
        OR: conditions,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rejections });
  } catch (error) {
    console.error("Fetch rejections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rejections" },
      { status: 500 }
    );
  }
}
