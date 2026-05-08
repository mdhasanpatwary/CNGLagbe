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
      // Use select to avoid over-fetching — only return fields needed by the frontend
      userData = await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          photoUrl: true,
          birthday: true,
          address: true,
          createdAt: true,
        },
      });
    } else if (session.role === "DRIVER") {
      // Use select to exclude passwordHash and heavy document URLs
      userData = await prisma.driver.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          photoUrl: true,
          isApproved: true,
          isSuspended: true,
          isOnline: true,
          vehicleNumber: true,
          vehicleType: true,
          nearbyBazar: true,
          address: true,
          birthday: true,
          nidNumber: true,
          licenseNumber: true,
          createdAt: true,
        },
      });
    }

    if (!userData) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...userData,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Auth Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
