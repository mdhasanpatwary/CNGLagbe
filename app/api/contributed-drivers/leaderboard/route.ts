import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    const contributorMap = new Map<string, { name: string; phone: string; photoUrl: string | null; count: number }>();

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
        });
      }
    }

    const leaderboard = Array.from(contributorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
