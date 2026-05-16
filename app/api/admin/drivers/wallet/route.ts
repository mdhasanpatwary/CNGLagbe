import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { driverId, amount, details } = await request.json();

    if (!driverId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create the wallet
      const wallet = await tx.driverWallet.upsert({
        where: { driverId },
        update: {
          balance: { increment: amount }
        },
        create: {
          driverId,
          balance: amount
        }
      });

      // 2. Create the transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: "PAYMENT",
          details: details || "Admin Manual Recharge"
        }
      });

      return { wallet, transaction };
    });

    return NextResponse.json({
      success: true,
      balance: result.wallet.balance,
      transaction: result.transaction
    });
  } catch (error) {
    console.error("Admin Wallet Recharge Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
