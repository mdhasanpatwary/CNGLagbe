import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { z } from "zod";

const resolveSchema = z.object({
  resolutionNote: z.string().min(1, "Resolution note is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate body
    const validation = resolveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input fields", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { resolutionNote } = validation.data;

    // Check if issue report exists
    const issue = await prisma.issueReport.findUnique({
      where: { id },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue report not found" }, { status: 404 });
    }

    // Resolve issue report
    const updatedIssue = await prisma.issueReport.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionNote,
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error("Admin Resolve Issue Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
