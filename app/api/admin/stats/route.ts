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
      pwaInstallations,
      activePwaInstallations,
      totalCallClicksAggregate
    ] = await Promise.all([
      prisma.user.count(),
      prisma.waitlist.count(),
      prisma.contributedDriver.count(),
      prisma.contributedDriver.count({ where: { isApproved: false } }),
      prisma.bazar.count(),
      (typeof (prisma as unknown as { pwaInstallation?: { count?: (args?: unknown) => Promise<number> } }).pwaInstallation?.count === "function"
        ? (prisma as unknown as { pwaInstallation: { count(args?: unknown): Promise<number> } }).pwaInstallation.count()
        : Promise.resolve(0)
      ).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("PwaInstallation table might not exist yet:", msg);
        return 0;
      }),
      (typeof (prisma as unknown as { pwaInstallation?: { count?: (args?: unknown) => Promise<number> } }).pwaInstallation?.count === "function"
        ? (prisma as unknown as { pwaInstallation: { count(args?: unknown): Promise<number> } }).pwaInstallation.count({
            where: {
              lastActiveAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          })
        : Promise.resolve(0)
      ).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("PwaInstallation active count error:", msg);
        return 0;
      }),
      prisma.contributedDriver.aggregate({
        _sum: {
          callCount: true,
        },
      }),
    ]);

    const totalCallClicks = totalCallClicksAggregate._sum.callCount || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWaitlist,
        totalContributedDrivers,
        pendingContributedDrivers,
        totalBazars,
        pwaInstallations,
        activePwaInstallations,
        totalCallClicks,
      }
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
