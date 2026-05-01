import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withIdempotency } from "@/lib/idempotency";
import { broadcastStatusChange } from "@/lib/realtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withIdempotency(request, user.sub, async () => {
      const { id } = await params;
      const body = await request.json();
      const { reason } = body;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { driver: true }
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return NextResponse.json({ error: "Booking already finished" }, { status: 400 });
      }

      let cancelledBy: "USER" | "DRIVER" | null = null;

      if ((user.role === "USER" || user.role === "ADMIN") && booking.userId === user.sub) {
        cancelledBy = "USER";
      } else if (user.role === "DRIVER" && booking.driverId === user.sub) {
        cancelledBy = "DRIVER";
      }

      if (!cancelledBy) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const now = new Date();
      
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledBy,
          cancelReason: reason,
        },
      });

      // Broadcast status change to both parties
      broadcastStatusChange(id, "CANCELLED");

      let driverForcedOffline = false;

      // Driver limit check
      if (cancelledBy === "DRIVER") {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentDriverCancels = await prisma.booking.count({
          where: {
            driverId: user.sub,
            status: "CANCELLED",
            cancelledBy: "DRIVER",
            cancelledAt: { gte: hourAgo },
          },
        });

        if (recentDriverCancels >= 3) {
          await prisma.driver.update({
            where: { id: user.sub },
            data: { isOnline: false },
          });
          driverForcedOffline = true;
        }
      }

      return NextResponse.json({ 
        success: true, 
        booking: updatedBooking,
        driverForcedOffline 
      });
    });
  } catch (error) {
    console.error("Cancellation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
