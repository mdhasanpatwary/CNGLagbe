import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { deviceId, userAgent, role } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    const installation = await prisma.pwaInstallation.upsert({
      where: { deviceId },
      update: {
        userAgent,
        role,
        lastActiveAt: new Date(),
      },
      create: {
        deviceId,
        userAgent,
        role,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: installation.id });
  } catch (error) {
    console.error("PWA Install Log Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
