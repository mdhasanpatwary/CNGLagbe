import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Run findMany and count in parallel instead of sequentially.
    // Use select to avoid returning sensitive fields (passwordHash, document URLs).
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          isOnline: true,
          isApproved: true,
          isSuspended: true,
          vehicleNumber: true,
          vehicleType: true,
          nearbyBazar: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.driver.count(),
    ]);

    return NextResponse.json({
      drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin Drivers List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
