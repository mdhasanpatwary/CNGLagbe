import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    const targetIds = Array.isArray(ids) ? ids : [];

    if (targetIds.length > 0) {
      await prisma.bazarRejection.deleteMany({
        where: {
          id: { in: targetIds },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Acknowledge rejections error:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge rejections" },
      { status: 500 }
    );
  }
}
