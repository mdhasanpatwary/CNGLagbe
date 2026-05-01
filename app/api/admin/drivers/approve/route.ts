import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { driverId, action } = await request.json();

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 });
    }

    if (action === "approve") {
      const driverData = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { nidNumber: true, licenseNumber: true, vehicleNumber: true }
      });

      if (!driverData) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }

      const missingFields = [];
      if (!driverData.nidNumber) missingFields.push("nidNumber");
      if (!driverData.licenseNumber) missingFields.push("licenseNumber");
      if (!driverData.vehicleNumber) missingFields.push("vehicleNumber");

      if (missingFields.length > 0) {
        return NextResponse.json({ 
          error: "Profile incomplete", 
          missingFields 
        }, { status: 422 });
      }
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
        const admin = await getAuthenticatedAdmin();
        if (!admin) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const pendingDrivers = await prisma.driver.findMany({
            where: { isApproved: false },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json({ drivers: pendingDrivers });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
