import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, photoUrl, birthday, password, address, nearbyBazar } = await request.json();

    const updateData: Prisma.UserUpdateInput = {};
    if (name) updateData.name = name;
    if (photoUrl) updateData.photoUrl = photoUrl;
    if (birthday) updateData.birthday = new Date(birthday);
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (session.role === "USER" || session.role === "ADMIN") {
      const updatedUser = await prisma.user.update({
        where: { id: session.sub },
        data: updateData,
      });

      // Sync updated name and photo URL across all contributed drivers by this user
      if (updateData.name !== undefined || updateData.photoUrl !== undefined) {
        await prisma.contributedDriver.updateMany({
          where: { contributorPhone: updatedUser.phone },
          data: {
            ...(updateData.name !== undefined ? { contributorName: updateData.name as string } : {}),
            ...(updateData.photoUrl !== undefined ? { contributorPhotoUrl: updateData.photoUrl as string | null } : {}),
          },
        });
      }
    } else if (session.role === "DRIVER") {
      // Drivers can only update address and nearbyBazar via this endpoint for now
      // Actually, let's keep driver logic as is or support password for them too if needed
      const driverUpdateData: Prisma.DriverUpdateInput = {};
      
      if (address !== undefined) driverUpdateData.address = address;
      if (nearbyBazar !== undefined) driverUpdateData.nearbyBazar = nearbyBazar;
      if (password) driverUpdateData.passwordHash = await bcrypt.hash(password, 10);

      if (Object.keys(driverUpdateData).length === 0) {
        return NextResponse.json({ success: true, message: "No updates provided" });
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

