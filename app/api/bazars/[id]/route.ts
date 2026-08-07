import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBanglaText } from "@/lib/bazar-mapping";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name, upazila, district, isApproved } = await request.json();

    if (name !== undefined && name !== null && name.trim() && !isBanglaText(name.trim())) {
      return NextResponse.json({ error: "BAZAR_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }

    if (upazila !== undefined && upazila !== null && upazila.trim() && !isBanglaText(upazila.trim())) {
      return NextResponse.json({ error: "UPAZILA_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }

    if (district !== undefined && district !== null && district.trim() && !isBanglaText(district.trim())) {
      return NextResponse.json({ error: "DISTRICT_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }
    
    // Wrap in transaction for atomicity: if driver update fails, bazar rename is rolled back
    const bazar = await prisma.$transaction(
      async (tx) => {
        // Get the old name to update drivers
        const oldBazar = await tx.bazar.findUnique({
          where: { id }
        });

        if (!oldBazar) {
          throw new Error("BAZAR_NOT_FOUND");
        }

        const dataToUpdate: { name?: string; upazila?: string; district?: string; isApproved?: boolean } = {};
        if (name !== undefined) {
          const trimmedName = name.trim();
          if (trimmedName !== oldBazar.name) {
            const existing = await tx.bazar.findUnique({
              where: { name: trimmedName }
            });
            if (existing) {
              throw new Error("BAZAR_EXISTS");
            }
          }
          dataToUpdate.name = trimmedName;
        }
        if (upazila !== undefined) dataToUpdate.upazila = upazila ? upazila.trim() : null;
        if (district !== undefined) dataToUpdate.district = district ? district.trim() : null;
        if (isApproved !== undefined) dataToUpdate.isApproved = isApproved;

        const updated = await tx.bazar.update({
          where: { id },
          data: dataToUpdate,
        });

        // Update all drivers and contributed drivers who have this bazar as their nearbyBazar, if name changed
        if (name && name.trim() !== oldBazar.name) {
          await tx.driver.updateMany({
            where: { nearbyBazar: oldBazar.name },
            data: { nearbyBazar: name.trim() },
          });
          await tx.contributedDriver.updateMany({
            where: { nearbyBazar: oldBazar.name },
            data: { nearbyBazar: name.trim() },
          });
        }

        return updated;
      },
      { maxWait: 10000, timeout: 20000 }
    );

    return NextResponse.json(bazar);
  } catch (error) {
    if (error instanceof Error && error.message === "BAZAR_NOT_FOUND") {
      return NextResponse.json({ error: "Bazar not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "BAZAR_EXISTS") {
      return NextResponse.json({ error: "BAZAR_EXISTS" }, { status: 400 });
    }
    console.error("Update bazar error:", error);
    return NextResponse.json({ 
      error: "Failed to update bazar",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    let reason = "";
    let mergeToBazarName = "";
    try {
      const body = await request.json();
      reason = body.reason || "";
      mergeToBazarName = body.mergeToBazarName || "";
    } catch {
      // Body might be missing or invalid
    }

    await prisma.$transaction(
      async (tx) => {
        const bazar = await tx.bazar.findUnique({
          where: { id },
        });

        if (!bazar) {
          throw new Error("BAZAR_NOT_FOUND");
        }

        // If a merge target is provided, reassign drivers; otherwise clear nearbyBazar
        if (mergeToBazarName && mergeToBazarName !== bazar.name) {
          await tx.driver.updateMany({
            where: { nearbyBazar: bazar.name },
            data: { nearbyBazar: mergeToBazarName },
          });
          await tx.contributedDriver.updateMany({
            where: { nearbyBazar: bazar.name },
            data: { nearbyBazar: mergeToBazarName },
          });
        } else {
          await tx.driver.updateMany({
            where: { nearbyBazar: bazar.name },
            data: { nearbyBazar: null },
          });
          await tx.contributedDriver.updateMany({
            where: { nearbyBazar: bazar.name },
            data: { nearbyBazar: null },
          });
        }

        if (reason) {
          await tx.bazarRejection.create({
            data: {
              name: bazar.name,
              reason: reason,
              userPhone: bazar.createdByPhone,
            },
          });
        }

        await tx.bazar.delete({
          where: { id },
        });
      },
      { maxWait: 10000, timeout: 20000 }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "BAZAR_NOT_FOUND") {
      return NextResponse.json({ error: "Bazar not found" }, { status: 404 });
    }
    console.error("Delete bazar error:", error);
    return NextResponse.json({ 
      error: "Failed to delete bazar",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
