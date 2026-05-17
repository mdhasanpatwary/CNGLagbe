import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.sub;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const timeframe = searchParams.get("timeframe") || "all";
    const type = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    const driverWallet = await prisma.driverWallet.findUnique({
      where: { driverId: userId },
      select: {
        id: true,
        balance: true,
        driver: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!driverWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const whereClause: Prisma.WalletTransactionWhereInput = {
      walletId: driverWallet.id,
    };

    if (type === "DEBIT") {
      whereClause.amount = { lt: 0 };
    } else if (type === "CREDIT") {
      whereClause.amount = { gt: 0 };
    }

    if (timeframe !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (timeframe === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        start.setDate(now.getDate() - 7);
      } else if (timeframe === "monthly") {
        start.setDate(now.getDate() - 30);
      }
      whereClause.createdAt = { gte: start };
    }

    const [transactions, totalFiltered] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              pickupAddress: true,
              destAddress: true,
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      balance: driverWallet.balance,
      driver: {
        id: driverWallet.driver.id,
        name: driverWallet.driver.name,
        photoUrl: driverWallet.driver.photoUrl,
        role: "DRIVER",
      },
      transactions,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    });
  } catch (error) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

