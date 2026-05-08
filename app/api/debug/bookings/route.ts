import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "No session" });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.sub },
    });

    return NextResponse.json({
      session,
      bookingsCount: bookings.length,
      bookings: bookings.map(b => ({ id: b.id, status: b.status, createdAt: b.createdAt }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
