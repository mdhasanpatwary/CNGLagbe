import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      pickupLat, pickupLng, destLat, destLng, 
      pickupAddress, destAddress, distance, fare, userId 
    } = body;

    if (!pickupLat || !pickupLng || !destLat || !destLng || distance == null || fare == null) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        destLat: Number(destLat),
        destLng: Number(destLng),
        pickupAddress,
        destAddress,
        distance: Number(distance),
        fare: Number(fare),
        userId: userId || null, // Guest bookings allowed
        status: "PENDING",
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking Create Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
