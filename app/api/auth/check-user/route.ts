import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // If user exists and has a password, we show the password field
    // If user doesn't exist or doesn't have a password set yet, we send OTP (1234)
    return NextResponse.json({
      exists: !!user,
      hasPassword: !!user?.passwordHash,
    });
  } catch (error) {
    console.error("Check User Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
