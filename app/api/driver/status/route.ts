import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: payload.sub },
      select: { id: true, isOnline: true, isApproved: true, name: true }
    });

    return NextResponse.json({ driver });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if approved before allowing online status
    const currentDriver = await prisma.driver.findUnique({
      where: { id: payload.sub },
      select: { isApproved: true }
    });

    const { isOnline } = await request.json();

    if (isOnline && !currentDriver?.isApproved) {
      return NextResponse.json({ error: "Driver not approved" }, { status: 403 });
    }

    const driver = await prisma.driver.update({
      where: { id: payload.sub },
      data: { isOnline: Boolean(isOnline) },
    });

    return NextResponse.json({ driver: { id: driver.id, isOnline: driver.isOnline, isApproved: driver.isApproved } });
  } catch (error) {
    console.error("Driver Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
