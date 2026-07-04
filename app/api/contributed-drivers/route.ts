import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { contributedDriverSchema } from "@/lib/schemas/contributed-driver";
import { getSystemSetting } from "@/lib/settings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bazar = searchParams.get("bazar");
    const search = searchParams.get("search");

    const where: Prisma.ContributedDriverWhereInput = { isApproved: true };

    if (bazar && bazar !== "ALL") {
      where.nearbyBazar = bazar;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const drivers = await prisma.contributedDriver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Fetch contributed drivers error:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contributedDriverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { name, phone, address, nearbyBazar } = result.data;

    // Check uniqueness across ContributedDriver
    const existingContributed = await prisma.contributedDriver.findUnique({
      where: { phone }
    });

    if (existingContributed) {
      return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });
    }

    // Check system setting for auto approve
    const autoApproveSetting = await getSystemSetting("AUTO_APPROVE_CONTRIBUTED_DRIVERS", "true");
    const isApproved = autoApproveSetting === "true";

    const driver = await prisma.contributedDriver.create({
      data: {
        name,
        phone,
        address: address || null,
        nearbyBazar,
        isApproved
      }
    });

    return NextResponse.json({ driver, autoApproved: isApproved });
  } catch (error) {
    console.error("Create contributed driver error:", error);
    return NextResponse.json({ error: "Failed to contribute driver" }, { status: 500 });
  }
}
