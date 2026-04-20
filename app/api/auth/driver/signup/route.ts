import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, phone, password, nidNumber, licenseNumber, vehicleNumber } = await request.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // Check if driver already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { phone },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver already registered with this phone" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        passwordHash: hashedPassword,
        nidNumber,
        licenseNumber,
        vehicleNumber,
        isApproved: false,
      },
    });

    const token = await signToken({
      sub: driver.id,
      role: "DRIVER",
    });

    return NextResponse.json({
      success: true,
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        isApproved: driver.isApproved
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
