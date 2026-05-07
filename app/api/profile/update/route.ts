import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, photoUrl, birthday, address, nearbyBazar } = await request.json();

    const updateData: Record<string, string | Date> = {};
    if (name) updateData.name = name;
    if (photoUrl) updateData.photoUrl = photoUrl;
    if (birthday) updateData.birthday = new Date(birthday);

    if (session.role === "USER" || session.role === "ADMIN") {
      await prisma.user.update({
        where: { id: session.sub },
        data: updateData,
      });
    } else if (session.role === "DRIVER") {
      // Drivers can only update address and nearbyBazar
      const driverUpdateData: Record<string, string | null> = {};
      
      if (address !== undefined) driverUpdateData.address = address;
      if (nearbyBazar !== undefined) driverUpdateData.nearbyBazar = nearbyBazar;

      if (Object.keys(driverUpdateData).length === 0) {
        return NextResponse.json({ success: true, message: "No updates allowed for these fields" });
      }

      await prisma.driver.update({
        where: { id: session.sub },
        data: driverUpdateData,
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
