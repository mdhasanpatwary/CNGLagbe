import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/auth";

export async function GET() {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pushToken = await prisma.driverPushToken.findUnique({
      where: { driverId },
    });

    return NextResponse.json({ pushToken });
  } catch (error) {
    console.error("GET Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Reject mock/test tokens — real FCM tokens are 100+ char base64-like strings
    if (token.startsWith("mock_") || token.length < 50) {
      console.warn(`Rejected invalid FCM token for driver ${driverId}: ${token.substring(0, 30)}...`);
      return NextResponse.json({ error: "Invalid FCM token format" }, { status: 400 });
    }

    const pushToken = await prisma.driverPushToken.upsert({
      where: { driverId },
      update: { token },
      create: { driverId, token },
    });

    return NextResponse.json({ pushToken });
  } catch (error) {
    console.error("POST Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.driverPushToken.deleteMany({
      where: { driverId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
