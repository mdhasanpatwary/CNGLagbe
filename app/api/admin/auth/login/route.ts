import { NextResponse } from "next/server";
import { setAuthCookie, signToken } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/schemas/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = adminLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone, password } = result.data;

    // Check hardcoded credentials
    if (phone === "01783721411" && password === "12345678") {
      // Ensure the admin has a record in the User table so they can use the app as a user
      let dbUser = await prisma.user.findUnique({
        where: { phone: phone },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            phone: phone,
            name: "Administrator",
            role: "ADMIN",
          },
        });
      }

      const token = await signToken({
        sub: dbUser.id,
        role: "ADMIN",
      });

      await setAuthCookie(token, request.headers.get("host"));

      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          phone: phone,
          role: "ADMIN",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid phone or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
