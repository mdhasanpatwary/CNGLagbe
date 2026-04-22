import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { driverId, action } = await request.json();

    if (!driverId || !["suspend", "unsuspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        isSuspended: action === "suspend",
        // If suspended, force offline
        ...(action === "suspend" ? { isOnline: false } : {})
      },
    });

    return NextResponse.json({ 
      success: true, 
      isSuspended: driver.isSuspended 
    });
  } catch (error) {
    console.error("Admin Suspend Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
