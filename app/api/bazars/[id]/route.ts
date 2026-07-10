import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBanglaText } from "@/lib/bazar-mapping";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name, isApproved } = await request.json();

    if (name !== undefined && !isBanglaText(name.trim())) {
      return NextResponse.json({ error: "BAZAR_NAME_MUST_BE_BANGLA" }, { status: 400 });
    }
    
    // Wrap in transaction for atomicity: if driver update fails, bazar rename is rolled back
    const bazar = await prisma.$transaction(async (tx) => {
      // Get the old name to update drivers
      const oldBazar = await tx.bazar.findUnique({
        where: { id }
      });

      if (!oldBazar) {
        throw new Error("BAZAR_NOT_FOUND");
      }

      const dataToUpdate: { name?: string; isApproved?: boolean } = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (isApproved !== undefined) dataToUpdate.isApproved = isApproved;

      const updated = await tx.bazar.update({
        where: { id },
        data: dataToUpdate,
      });

      // Update all drivers and contributed drivers who have this bazar as their nearbyBazar, if name changed
      if (name && name !== oldBazar.name) {
        await tx.driver.updateMany({
          where: { nearbyBazar: oldBazar.name },
          data: { nearbyBazar: name },
        });
        await tx.contributedDriver.updateMany({
          where: { nearbyBazar: oldBazar.name },
          data: { nearbyBazar: name },
        });
      }

      return updated;
    });

    return NextResponse.json(bazar);
  } catch (error) {
    if (error instanceof Error && error.message === "BAZAR_NOT_FOUND") {
      return NextResponse.json({ error: "Bazar not found" }, { status: 404 });
    }
    console.error("Update bazar error:", error);
    return NextResponse.json({ 
      error: "Failed to update bazar",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.bazar.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bazar error:", error);
    return NextResponse.json({ 
      error: "Failed to delete bazar",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
