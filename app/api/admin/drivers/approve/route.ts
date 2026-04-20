import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // In a real app, check for admin session here
    const { driverId, action } = await request.json();

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isApproved: action === "approve" },
    });

    return NextResponse.json({ success: true, driver: { id: driver.id, isApproved: driver.isApproved } });
  } catch (error) {
    console.error("Admin Approval Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
    try {
        const pendingDrivers = await prisma.driver.findMany({
            where: { isApproved: false },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json({ drivers: pendingDrivers });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
