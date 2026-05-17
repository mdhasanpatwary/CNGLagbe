import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: driverId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const timeframe = searchParams.get("timeframe") || "all";
    const type = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    // Get the driver's wallet ID
    const wallet = await prisma.driverWallet.findUnique({
      where: { driverId },
      select: { id: true },
    });

    if (!wallet) {
      return NextResponse.json({
        transactions: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      });
    }

    const whereClause: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
    };

    // Filter by Debit/Credit
    if (type === "DEBIT") {
      whereClause.amount = { lt: 0 };
    } else if (type === "CREDIT") {
      whereClause.amount = { gt: 0 };
    }

    // Filter by Timeframe
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
      transactions,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    });
  } catch (error) {
    console.error("Admin Fetch Wallet Ledger Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
