import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance, calculateFare } from "@/lib/fare";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupLat, pickupLng, destLat, destLng, distance: manualDistance } = body;

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Use manually provided distance (e.g. from Google Maps route) or fallback to Haversine
    const distance = manualDistance !== undefined 
      ? Number(manualDistance)
      : calculateDistance(
          Number(pickupLat),
          Number(pickupLng),
          Number(destLat),
          Number(destLng)
        );

    // Fetch dynamic platform fee setting
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: "PLATFORM_FEE_PERCENTAGE" },
    });
    const platformFeePercentage = feeSetting ? Number(feeSetting.value) : 5;

    // Fetch dynamic CNG per KM rate setting
    const rateSetting = await prisma.systemSetting.findUnique({
      where: { key: "CNG_PER_KM_RATE" },
    });
    const perKmRate = rateSetting ? Number(rateSetting.value) : 20;

    const fareBreakdown = calculateFare(distance, platformFeePercentage, perKmRate);

    return NextResponse.json({
      distance,
      ...fareBreakdown,
      currency: "BDT",
    });
  } catch (error) {
    console.error("Fare Calculate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
