import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalWaitlist,
      totalContributedDrivers,
      pendingContributedDrivers,
      totalBazars,
      pwaInstallations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.waitlist.count(),
      prisma.contributedDriver.count(),
      prisma.contributedDriver.count({ where: { isApproved: false } }),
      prisma.bazar.count(),
      ("pwaInstallation" in prisma
        ? (prisma as unknown as { pwaInstallation: { count(): Promise<number> } }).pwaInstallation.count()
        : Promise.resolve(0)
      ).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("PwaInstallation table might not exist yet:", msg);
        return 0;
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWaitlist,
        totalContributedDrivers,
        pendingContributedDrivers,
        totalBazars,
        pwaInstallations
      }
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
