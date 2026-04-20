import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  // Round to 5 decimal places for a stable cache key (~1m precision)
  const cLat = Math.round(lat * 100000) / 100000;
  const cLng = Math.round(lng * 100000) / 100000;

  try {
    // 1. Check cache
    const cached = await prisma.geoCache.findUnique({
      where: {
        lat_lng: { lat: cLat, lng: cLng }
      }
    });

    if (cached) {
      return NextResponse.json({ address: cached.address, cached: true });
    }

    // 2. Call Google Geocoding API if not cached
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const address = data.results[0].formatted_address;

      // 3. Save to cache (background error handling)
      try {
        await prisma.geoCache.upsert({
          where: { lat_lng: { lat: cLat, lng: cLng } },
          update: { address },
          create: { lat: cLat, lng: cLng, address }
        });
      } catch (e) {
        console.error("GeoCache upsert error:", e);
      }

      return NextResponse.json({ address, cached: false });
    }

    return NextResponse.json({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, error: data.status });
  } catch (error) {
    console.error("Geocode API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
