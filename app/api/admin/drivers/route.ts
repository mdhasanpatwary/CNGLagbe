import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { driverSignupSchema } from "@/lib/schemas/auth";
import { z } from "zod";

import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const sort = searchParams.get("sort") || "latest";
    const skip = (page - 1) * limit;

    const where: Prisma.DriverWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === "suspended") {
      where.isSuspended = true;
    } else if (filter === "minus_balance") {
      where.wallet = {
        balance: { lt: 0 }
      };
    }

    let orderBy: Prisma.DriverOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "top_rated") {
      orderBy = { averageRating: "desc" };
    } else if (sort === "top_income") {
      orderBy = { totalIncome: "desc" };
    } else if (sort === "top_ride") {
      orderBy = { totalRides: "desc" };
    }

    // Run findMany and count in parallel instead of sequentially.
    // Use select to avoid returning sensitive fields (passwordHash, document URLs).
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          phone: true,
          isOnline: true,
          isApproved: true,
          isSuspended: true,
          vehicleNumber: true,
          vehicleType: true,
          nearbyBazar: true,
          averageRating: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          photoUrl: true,
          nidNumber: true,
          nidFrontUrl: true,
          nidBackUrl: true,
          licenseNumber: true,
          licenseFrontUrl: true,
          licenseBackUrl: true,
          address: true,
          wallet: {
            select: {
              balance: true
            }
          }
        },
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin Drivers List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = driverSignupSchema.parse(body);

    // Check if driver already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { phone: validatedData.phone },
    });

    if (existingDriver) {
      return NextResponse.json({ error: "Driver with this phone number already exists" }, { status: 400 });
    }

    // Create driver and wallet in a transaction
    const driver = await prisma.$transaction(async (tx) => {
      const newDriver = await tx.driver.create({
        data: {
          ...validatedData,
          passwordHash: "skipped", // MVP phone-only login
          isApproved: true, // Auto-approve when created by admin
        },
      });

      await tx.driverWallet.create({
        data: {
          driverId: newDriver.id,
          balance: 0,
        },
      });

      return newDriver;
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Admin Driver Create Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

