import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  await clearAuthCookie(request.headers.get("host"));
  return NextResponse.json({ success: true });
}
