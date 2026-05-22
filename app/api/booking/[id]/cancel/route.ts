import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withIdempotency } from "@/lib/idempotency";
import { broadcastStatusChange } from "@/lib/realtime";
import { calculateDistance } from "@/lib/booking-utils";

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
          pickupLat: true,
          pickupLng: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return NextResponse.json({ error: "Booking already finished" }, { status: 400 });
      }

      if (booking.status === "PICKED_UP") {
        return NextResponse.json({ error: "Cannot cancel a booking in progress" }, { status: 400 });
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

        // Detect suspicious cancellation (driver near pickup)
        const driverData = await prisma.driver.findUnique({
          where: { id: user.sub },
          select: { currentLat: true, currentLng: true },
        });

        let isSuspicious = false;
        if (driverData?.currentLat && driverData?.currentLng) {
          const dist = calculateDistance(
            driverData.currentLat,
            driverData.currentLng,
            booking.pickupLat,
            booking.pickupLng
          );
          // If within 500m of pickup, it's a suspicious cancellation
          if (dist < 500) {
            isSuspicious = true;
          }
        }

        const [updatedBooking, recentDriverCancels] = await Promise.all([
          prisma.booking.update({
            where: { id },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              cancelledBy,
              cancelReason: reason,
              isSuspicious,
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
        const suspiciousLimitReached = recentDriverCancels >= 2;
        const shouldStayOffline = (suspiciousLimitReached || isSuspicious);
        
        await prisma.driver.update({
          where: { id: user.sub },
          data: { 
            isOnline: shouldStayOffline ? false : {
              // Only go online if NOT suspended
              set: true
            }
          },
        });

        // If the driver is suspended, we MUST ensure they stay offline regardless of shouldStayOffline
        await prisma.driver.updateMany({
          where: { id: user.sub, isSuspended: true },
          data: { isOnline: false }
        });
        
        if (shouldStayOffline) {
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
        const updatedBooking = await prisma.$transaction(async (tx) => {
          const bookingUpdate = await tx.booking.update({
            where: { id },
            data: {
              status: "CANCELLED",
              cancelledAt: now,
              cancelledBy,
              cancelReason: reason,
            },
          });

          if (booking.driverId) {
            await tx.driver.updateMany({
              where: {
                id: booking.driverId,
                isSuspended: false,
              },
              data: { isOnline: true },
            });
          }

          return bookingUpdate;
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
