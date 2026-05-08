import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, signToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
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

    // Rate Limit Check (5 attempts / 15 mins)
    const rateLimitKey = `login:driver:${phone}`;
    const { allowed } = await checkRateLimit(rateLimitKey, 5, 900);
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found. Please sign up.", signupRequired: true },
        { status: 404 }
      );
    }

    const token = await signToken({
      sub: driver.id,
      role: "DRIVER",
    });

    await setAuthCookie(token, request.headers.get("host"));
    await resetRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        isApproved: driver.isApproved,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
