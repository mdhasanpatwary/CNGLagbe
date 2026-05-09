import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, signToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    const otp = body.otp;
    const password = body.password;
    const newPassword = body.newPassword;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Rate Limit Check (5 attempts / 15 mins)
    const rateLimitKey = `login:user:${phone}`;
    const { allowed } = await checkRateLimit(rateLimitKey, 10, 900); // Increased limit for complex flow
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { phone },
    });

    // CASE 1: Existing User Logging in with Password
    if (user && user.passwordHash && password) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    } 
    // CASE 2: New User or No Password Set - OTP Verification & Password Setup
    else if (otp && newPassword) {
      // MVP: Default OTP 1234
      if (otp !== "1234") {
        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      if (user) {
        // User exists but setting/updating password
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      } else {
        // First time login - create user
        user = await prisma.user.create({
          data: {
            phone,
            name: "User",
            passwordHash,
          },
        });
      }
    }
    // INVALID REQUEST
    else {
      return NextResponse.json(
        { error: "Missing required fields (password or otp+newPassword)" },
        { status: 400 }
      );
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

