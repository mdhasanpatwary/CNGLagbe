// Cron job for booking expiry cleanup
// Deploy as Vercel Cron: https://vercel.com/docs/cron-jobs

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingRequestTimeoutThreshold } from "@/constants/booking";
import { getBookingTimeoutMinutes } from "@/lib/settings";

export async function GET() {
  try {
    const timeoutMinutes = await getBookingTimeoutMinutes();
    const timeoutThreshold = getBookingRequestTimeoutThreshold(timeoutMinutes);

    const result = await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: timeoutThreshold },
      },
      data: {
        status: "TIMED_OUT",
      },
    });

    console.log(`Expired ${result.count} bookings`);
    return NextResponse.json({ success: true, expired: result.count });
  } catch (error) {
    console.error("Booking expiry cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
