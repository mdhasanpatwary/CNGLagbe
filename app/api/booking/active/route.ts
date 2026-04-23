import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

// Simple in-memory cache
const activeBookingCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Rate Limiting (max 1 request per 3 seconds for this specific user)
    const rlKey = `active_booking:${user.sub}`;
    const rl = await rateLimit(rlKey, 1, 3);
    
    // 2. Check Cache
    const cached = activeBookingCache.get(user.sub);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    if (!rl.success && !cached) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 3. Database Query with select for performance
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId: user.sub,
        status: { in: ["PENDING", "ACCEPTED"] },
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
      const timeoutThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes
      if (activeBooking.createdAt < timeoutThreshold) {
        await prisma.booking.update({
          where: { id: activeBooking.id },
          data: { status: "TIMED_OUT" },
        }).catch(console.error);

        const responseData = { booking: null };
        activeBookingCache.set(user.sub, { data: responseData, timestamp: Date.now() });
        return NextResponse.json(responseData);
      }
    }

    const responseData = { booking: activeBooking };
    
    // Update cache
    activeBookingCache.set(user.sub, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Fetch Active Booking Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
