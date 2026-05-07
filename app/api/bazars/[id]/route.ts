import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { name } = await request.json();
    
    // Get the old name first to update drivers
    const oldBazar = await prisma.bazar.findUnique({
      where: { id }
    });

    if (!oldBazar) {
      return NextResponse.json({ error: "Bazar not found" }, { status: 404 });
    }

    const bazar = await prisma.bazar.update({
      where: { id },
      data: { name },
    });

    // Update all drivers who have this bazar as their nearbyBazar
    await prisma.driver.updateMany({
      where: { nearbyBazar: oldBazar.name },
      data: { nearbyBazar: name },
    });

    return NextResponse.json(bazar);
  } catch (error) {
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
