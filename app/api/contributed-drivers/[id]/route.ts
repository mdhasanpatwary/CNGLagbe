import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userPhone = "";
    if (session.role === "USER" || session.role === "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { phone: true }
      });
      userPhone = user?.phone || "";
    } else if (session.role === "DRIVER") {
      const driver = await prisma.driver.findUnique({
        where: { id: session.sub },
        select: { phone: true }
      });
      userPhone = driver?.phone || "";
    }

    if (!userPhone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const driver = await prisma.contributedDriver.findUnique({
      where: { id }
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const isContributor = driver.contributorPhone === userPhone;
    const isAdmin = session.role === "ADMIN";

    if (!isContributor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.contributedDriver.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contributed driver error:", error);
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
