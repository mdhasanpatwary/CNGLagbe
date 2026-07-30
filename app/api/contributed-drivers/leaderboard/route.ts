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

    // Use DB-level groupBy instead of fetching all records into memory
    const grouped = await prisma.contributedDriver.groupBy({
      by: ["contributorPhone"],
      where: {
        isApproved: true,
        contributorPhone: { not: null },
        contributorName: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      ...(!isNaN(limit) && limit > 0 ? { take: limit } : {}),
    });

    if (grouped.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch name + photoUrl for the grouped phones in a single targeted query
    const phones = grouped.map((g) => g.contributorPhone!);
    const details = await prisma.contributedDriver.findMany({
      where: {
        contributorPhone: { in: phones },
        isApproved: true,
        contributorName: { not: null },
      },
      select: {
        contributorPhone: true,
        contributorName: true,
        contributorPhotoUrl: true,
      },
      distinct: ["contributorPhone"],
    });

    const detailMap = new Map(details.map((d) => [d.contributorPhone, d]));

    const leaderboard = grouped.map((g) => {
      const phone = g.contributorPhone!;
      const detail = detailMap.get(phone);
      const maskedPhone =
        phone.length === 11
          ? `${phone.slice(0, 4)}***${phone.slice(8)}`
          : phone;

      return {
        name: detail?.contributorName ?? "Anonymous",
        phone: maskedPhone,
        photoUrl: detail?.contributorPhotoUrl ?? null,
        count: g._count.id,
        hash: getPhoneHash(phone),
      };
    });

    return NextResponse.json(leaderboard, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
