import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { 
      name, phone, nidNumber, licenseNumber, vehicleNumber, vehicleType, photoUrl, 
      address, nearbyBazar, nidFrontUrl, nidBackUrl, licenseFrontUrl, licenseBackUrl 
    } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone are required" },
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

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        passwordHash: "skipped", // MVP phone-only login
        nidNumber,
        licenseNumber,
        vehicleNumber,
        vehicleType,
        photoUrl,
        nidFrontUrl,
        nidBackUrl,
        licenseFrontUrl,
        licenseBackUrl,
        address,
        nearbyBazar,
        isApproved: false,
      },
    });

    const token = await signToken({
      sub: driver.id,
      role: "DRIVER",
    });

    await setAuthCookie(token, request.headers.get("host"));

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        isApproved: driver.isApproved
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Signup Error Details:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
