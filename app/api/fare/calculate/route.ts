import { NextResponse } from "next/server";
import { calculateDistance, calculateFare } from "@/lib/fare";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupLat, pickupLng, destLat, destLng } = body;

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const distance = calculateDistance(
      Number(pickupLat),
      Number(pickupLng),
      Number(destLat),
      Number(destLng)
    );

    const fare = calculateFare(distance);

    return NextResponse.json({
      distance,
      fare,
      currency: "BDT",
    });
  } catch (error) {
    console.error("Fare Calculate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
