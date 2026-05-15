import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.sub;

    const wallet = await prisma.driverWallet.findUnique({
      where: { driverId: userId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          }
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            booking: {
              select: {
                pickupAddress: true,
                destAddress: true,
              }
            }
          }
        }
      }
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...wallet,
      driver: {
        ...wallet.driver,
        role: "DRIVER"
      }
    });
  } catch (error) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
