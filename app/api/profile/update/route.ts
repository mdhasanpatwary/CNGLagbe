import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, photoUrl, birthday } = await request.json();

    const updateData: Record<string, string | Date> = {};
    if (name) updateData.name = name;
    if (photoUrl) updateData.photoUrl = photoUrl;
    if (birthday) updateData.birthday = new Date(birthday);

    if (session.role === "USER") {
      await prisma.user.update({
        where: { id: session.sub },
        data: updateData,
      });
    } else if (session.role === "DRIVER") {
      await prisma.driver.update({
        where: { id: session.sub },
        data: updateData,
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
