import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { BoundedCache } from "@/lib/bounded-cache";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";
import { getBookingTimeoutMinutes } from "@/lib/settings";

// BoundedCache prevents unbounded memory growth from accumulating unique user IDs
const activeBookingCache = new BoundedCache<Record<string, unknown>>(5000); // 5s TTL

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "USER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Rate Limiting (max 1 request per 3 seconds for this specific user)
    const rlKey = `active_booking:${user.sub}`;
    const rl = await rateLimit(rlKey, 1, 3);
    
    // 2. Check Cache (BoundedCache handles TTL internally)
    const cached = activeBookingCache.get(user.sub);
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!rl.success && !cached) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 3. Database Query with select for performance
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId: user.sub,
        status: { in: ["PENDING", "ACCEPTED", "PICKED_UP"] },
      },
      select: {
        id: true,
        status: true,
        fare: true,
        createdAt: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            photoUrl: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Auto-cancel logic for stale PENDING bookings
    if (activeBooking && activeBooking.status === "PENDING") {
      const timeoutMinutes = await getBookingTimeoutMinutes();
      const timeoutThreshold = getBookingRequestTimeoutThreshold(timeoutMinutes);
      if (activeBooking.createdAt < timeoutThreshold) {
        await prisma.booking.update({
          where: { id: activeBooking.id },
          data: { status: "TIMED_OUT" },
        }).catch(console.error);

        const responseData = { booking: null };
        activeBookingCache.set(user.sub, responseData);
        return NextResponse.json(responseData);
      }
    }

    const responseData = { booking: activeBooking };
    
    // Update cache
    activeBookingCache.set(user.sub, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Fetch Active Booking Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
