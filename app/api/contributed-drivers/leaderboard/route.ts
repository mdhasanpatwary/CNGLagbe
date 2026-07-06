import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function getPhoneHash(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const approvedContributions = await prisma.contributedDriver.findMany({
      where: {
        isApproved: true,
        contributorPhone: { not: null },
        contributorName: { not: null },
      },
      select: {
        contributorName: true,
        contributorPhone: true,
        contributorPhotoUrl: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const contributorMap = new Map<string, { name: string; phone: string; photoUrl: string | null; count: number; hash: string }>();

    for (const contrib of approvedContributions) {
      const phone = contrib.contributorPhone!;
      const name = contrib.contributorName!;
      const photoUrl = contrib.contributorPhotoUrl || null;

      const existing = contributorMap.get(phone);
      if (existing) {
        existing.count += 1;
      } else {
        // Mask phone number for privacy: e.g. 0171***5678
        const maskedPhone = phone.length === 11 
          ? `${phone.slice(0, 4)}***${phone.slice(8)}`
          : phone;

        contributorMap.set(phone, {
          name,
          phone: maskedPhone,
          photoUrl,
          count: 1,
          hash: getPhoneHash(phone),
        });
      }
    }

    let leaderboard = Array.from(contributorMap.values())
      .sort((a, b) => b.count - a.count);

    if (!isNaN(limit) && limit > 0) {
      leaderboard = leaderboard.slice(0, limit);
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
