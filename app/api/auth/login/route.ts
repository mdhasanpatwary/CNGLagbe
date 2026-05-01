import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, signToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Rate Limit Check (5 attempts / 15 mins)
    const rateLimitKey = `login:user:${phone}`;
    const { allowed } = await checkRateLimit(rateLimitKey, 5, 900);
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // MVP: Skip OTP verification (allow any 4-6 digit code)
    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Find or Create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: "User", // Default name for MVP
        },
      });
    }

    const token = await signToken({
      sub: user.id,
      role: user.role as "DRIVER" | "USER" | "ADMIN",
    });

    await setAuthCookie(token, request.headers.get("host"));
    await resetRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
