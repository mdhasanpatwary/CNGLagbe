import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: { name: true, phone: true }
        }
      }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Admin User History Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
