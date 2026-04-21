import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId: user.sub,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeBooking && activeBooking.status === "PENDING") {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (activeBooking.createdAt < fiveMinsAgo) {
        // Auto-expire
        await prisma.booking.update({
          where: { id: activeBooking.id },
          data: { status: "TIMED_OUT" },
        }).catch(console.error);

        return NextResponse.json({ booking: null });
      }
    }

    return NextResponse.json({ booking: activeBooking });
  } catch (error) {
    console.error("Fetch Active Booking Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
