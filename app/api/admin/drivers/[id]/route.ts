import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { driverSignupSchema } from "@/lib/schemas/auth";
import { z } from "zod";

const driverUpdateSchema = driverSignupSchema.partial();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = driverUpdateSchema.parse(body);

    const driver = await prisma.driver.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Admin Driver Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Hard Delete Implementation
    // We need to handle relations to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // 1. Handle Booking Rejections
      await tx.bookingRejection.deleteMany({
        where: { driverId: id },
      });

      // 2. Handle Bookings (Set driverId to null to preserve records)
      await tx.booking.updateMany({
        where: { driverId: id },
        data: { driverId: null },
      });

      // 3. Handle Wallet Transactions
      const wallet = await tx.driverWallet.findUnique({
        where: { driverId: id },
        select: { id: true },
      });

      if (wallet) {
        await tx.walletTransaction.deleteMany({
          where: { walletId: wallet.id },
        });

        // 4. Delete Driver Wallet
        await tx.driverWallet.delete({
          where: { id: wallet.id },
        });
      }

      // 5. Finally, delete the driver
      await tx.driver.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Admin Driver Delete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
