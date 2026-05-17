import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  reason: z.enum([
    "DRIVER_DEMANDED_EXTRA_MONEY",
    "DRIVER_BEHAVED_POORLY",
    "DRIVER_DID_NOT_ARRIVE",
    "LOST_ITEMS_IN_VEHICLE",
    "OTHER",
  ]),
  details: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate body
    const validation = reportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input fields", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { reason, details } = validation.data;

    // Mandate details if OTHER is selected
    if (reason === "OTHER" && (!details || !details.trim())) {
      return NextResponse.json(
        { error: "Details are required when selecting 'Other' reason." },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify it belongs to the passenger
    if (booking.userId !== session.sub) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this booking" },
        { status: 403 }
      );
    }

    // Verify booking is completed or cancelled
    if (booking.status !== "COMPLETED" && booking.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Complaints can only be filed for completed or cancelled bookings." },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.issueReport.create({
      data: {
        bookingId: id,
        userId: session.sub,
        reason,
        details: details || null,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error("Issue Report Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
