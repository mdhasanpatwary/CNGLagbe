import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/schemas/waitlist";

export async function GET() {
  try {
    const count = await prisma.waitlist.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Fetch waitlist count error:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist count" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = waitlistSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.format() }, { status: 400 });
    }

    const { name, phone, role } = validated.data;

    // Check for existing phone number
    const existing = await prisma.waitlist.findUnique({
      where: { phone }
    });

    if (existing) {
      return NextResponse.json({ error: "DUPLICATE_PHONE" }, { status: 409 });
    }

    await prisma.waitlist.create({
      data: {
        name: name || null,
        phone,
        role
      }
    });

    const count = await prisma.waitlist.count();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
