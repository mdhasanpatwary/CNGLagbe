import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await withIdempotency(request, session.sub, async () => {
      const { reason, details } = await request.json();
      if (!reason) {
        return NextResponse.json({ error: "Reason required" }, { status: 400 });
      }

      const p = await params;
      const booking = await prisma.booking.findUnique({
        where: { id: p.id },
      });

      if (!booking || booking.userId !== session.sub) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const report = await prisma.issueReport.create({
        data: {
          bookingId: p.id,
          userId: session.sub,
          reason,
          details,
        },
      });

      return NextResponse.json({ report });
    });
  } catch (error) {
    console.error("Issue Reporting Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
