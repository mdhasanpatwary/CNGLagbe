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
        select: {
          id: true,
          status: true,
          userId: true,
          driverId: true,
        },
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

      // Run the cancellation update and, if driver-cancelled, the rate check in parallel
      let driverForcedOffline = false;

      if (cancelledBy === "DRIVER") {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const [updatedBooking, recentDriverCancels] = await Promise.all([
          prisma.booking.update({
            where: { id },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              cancelledBy,
              cancelReason: reason,
            },
          }),
          prisma.booking.count({
            where: {
              driverId: user.sub,
              status: "CANCELLED",
              cancelledBy: "DRIVER",
              cancelledAt: { gte: hourAgo },
            },
          }),
        ]);

        // +1 because the update above just added another cancellation that the count
        // query may or may not have seen (race), so use >= 2 as threshold (3 total including this one)
        if (recentDriverCancels >= 2) {
          await prisma.driver.update({
            where: { id: user.sub },
            data: { isOnline: false },
          });
          driverForcedOffline = true;
        }

        // Broadcast status change to both parties
        broadcastStatusChange(id, "CANCELLED");

        return NextResponse.json({
          success: true,
          booking: updatedBooking,
          driverForcedOffline,
        });
      } else {
        // User cancellation — no rate-limit check needed
        const updatedBooking = await prisma.booking.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            cancelledBy,
            cancelReason: reason,
          },
        });

        broadcastStatusChange(id, "CANCELLED");

        return NextResponse.json({
          success: true,
          booking: updatedBooking,
          driverForcedOffline: false,
        });
      }
    });
  } catch (error) {
    console.error("Cancellation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
