import { Prisma } from "@prisma/client";
import { BookingStatus } from "@/lib/types/booking";

interface SearchParams {
  status?: string | null;
  timeframe?: string | null;
  search?: string | null;
}

export function buildDriverHistoryWhere(driverId: string, params: SearchParams): Prisma.BookingWhereInput {
  const { status, timeframe, search } = params;
  
  const whereClause: Prisma.BookingWhereInput = {
    driverId,
    status: status ? (status as BookingStatus) : { in: ["COMPLETED", "CANCELLED"] as BookingStatus[] },
  };

  if (timeframe && timeframe !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (timeframe === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === "weekly") {
      start.setDate(now.getDate() - 7);
    } else if (timeframe === "monthly") {
      start.setDate(now.getDate() - 30);
    }
    whereClause.createdAt = { gte: start };
  }

  if (search && search.trim()) {
    const query = search.trim();
    whereClause.OR = [
      { pickupAddress: { contains: query, mode: "insensitive" } },
      { destAddress: { contains: query, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } }
          ]
        }
      }
    ];
  }

  return whereClause;
}
