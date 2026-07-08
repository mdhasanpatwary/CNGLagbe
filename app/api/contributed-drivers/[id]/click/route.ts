import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing driver ID" }, { status: 400 });
    }

    const updated = await prisma.contributedDriver.update({
      where: { id },
      data: {
        callCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, callCount: updated.callCount });
  } catch (error) {
    console.error("Error updating call count:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
