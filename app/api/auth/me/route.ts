import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let userData = null;
    if (session.role === "USER" || session.role === "ADMIN") {
      userData = await prisma.user.findUnique({
        where: { id: session.sub },
      });
    } else if (session.role === "DRIVER") {
      userData = await prisma.driver.findUnique({
        where: { id: session.sub },
      });
    }

    if (!userData) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const safeUserData = { ...(userData as Record<string, unknown>) };
    delete safeUserData.passwordHash;

    return NextResponse.json({
      authenticated: true,
      user: {
        ...safeUserData,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Auth Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
