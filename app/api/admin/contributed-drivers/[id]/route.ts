import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { isBanglaText } from "@/lib/bazar-mapping";

import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").refine(isBanglaText, "নাম অবশ্যই বাংলায় হতে হবে (বাংলা অক্ষরে লিখুন)"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Please enter a valid 11-digit Bangladeshi mobile number"),
  address: z.string().optional().nullable(),
  nearbyBazar: z.string().min(1, "Please select a bazar/stand").refine(isBanglaText, "বাজারের নাম অবশ্যই বাংলায় হতে হবে"),
  vehicleType: z.enum(["CNG", "TOTO", "AMBULANCE"]),
  isApproved: z.boolean().optional(),
  contributorName: z.string().optional().nullable().or(z.literal("")),
  contributorPhone: z.string().optional().nullable().or(z.literal("")),
  contributorPhotoUrl: z.string().optional().nullable().or(z.literal("")),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const {
      name,
      phone,
      address,
      nearbyBazar,
      vehicleType,
      isApproved,
      contributorName,
      contributorPhone,
      contributorPhotoUrl,
    } = result.data;

    // Check phone uniqueness among other drivers (excluding current one)
    const existingContributed = await prisma.contributedDriver.findFirst({
      where: {
        phone,
        NOT: { id }
      }
    });

    if (existingContributed) {
      return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });
    }

    const updated = await prisma.contributedDriver.update({
      where: { id },
      data: {
        name,
        phone,
        address: address || null,
        nearbyBazar,
        vehicleType,
        isApproved,
        contributorName: contributorName || null,
        contributorPhone: contributorPhone || null,
        contributorPhotoUrl: contributorPhotoUrl || null,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin update contributed driver error:", error);
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.contributedDriver.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete contributed driver error:", error);
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
