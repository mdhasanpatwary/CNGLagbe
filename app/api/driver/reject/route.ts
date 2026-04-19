import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// For MVP, rejecting just tells the client to hide the booking request locally 
// so we don't have to maintain an array of 'rejectedBy' driver IDs in the DB
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Booking rejected locally" });
  } catch (error) {
    console.error("Driver Reject Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
