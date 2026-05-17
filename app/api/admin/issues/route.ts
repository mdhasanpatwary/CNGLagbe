import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL"; // "ALL", "OPEN", "RESOLVED"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build filter query
    const where: Prisma.IssueReportWhereInput = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (search.trim()) {
      where.OR = [
        {
          booking: {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            },
          },
        },
        {
          booking: {
            driver: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            },
          },
        },
      ];
    }

    // Query issues with relation data
    const [issues, total] = await Promise.all([
      prisma.issueReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
              driver: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      prisma.issueReport.count({ where }),
    ]);

    return NextResponse.json({
      issues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Issues GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
