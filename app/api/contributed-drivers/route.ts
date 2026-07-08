import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { contributedDriverSchema } from "@/lib/schemas/contributed-driver";
import { getSystemSetting } from "@/lib/settings";
import { getAuthUser, signToken, setAuthCookie } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";
import { createHash } from "crypto";
import { BoundedCache } from "@/lib/bounded-cache";

// Cache hash → phone for 5 minutes. Avoids full-table scan on repeated contributor filter requests.
const hashToPhoneCache = new BoundedCache<string>(5 * 60 * 1000, 500);

function getPhoneHash(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bazar = searchParams.get("bazar");
    const search = searchParams.get("search");
    const vehicleType = searchParams.get("vehicleType");
    const limitParam = searchParams.get("limit");
    const contributorHash = searchParams.get("contributorHash");

    const where: Prisma.ContributedDriverWhereInput = { isApproved: true };

    if (bazar && bazar !== "ALL") {
      where.nearbyBazar = bazar;
    }

    if (vehicleType && vehicleType !== "ALL") {
      where.vehicleType = vehicleType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (contributorHash) {
      // Check cache first to avoid repeated full-table scans
      let resolvedPhone = hashToPhoneCache.get(contributorHash);

      if (!resolvedPhone) {
        const distinctContributors = await prisma.contributedDriver.findMany({
          where: { isApproved: true, contributorPhone: { not: null } },
          select: { contributorPhone: true },
          distinct: ["contributorPhone"],
        });
        const match = distinctContributors.find(
          (c) => c.contributorPhone && getPhoneHash(c.contributorPhone) === contributorHash
        );
        if (match?.contributorPhone) {
          resolvedPhone = match.contributorPhone;
          hashToPhoneCache.set(contributorHash, resolvedPhone);
        }
      }

      where.contributorPhone = resolvedPhone ?? "non-existent-phone";
    }

    const pageParam = searchParams.get("page");

    let take: number | undefined = 10;
    let skip: number | undefined = undefined;

    if (limitParam === "all") {
      take = undefined;
    } else {
      const parsedLimit = limitParam ? parseInt(limitParam, 10) : 10;
      if (!isNaN(parsedLimit)) {
        take = parsedLimit;

        if (pageParam) {
          const parsedPage = parseInt(pageParam, 10);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            skip = (parsedPage - 1) * take;
          }
        }
      }
    }

    const drivers = await prisma.contributedDriver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(take !== undefined ? { take } : {}),
      ...(skip !== undefined ? { skip } : {}),
    });

    const totalCount = await prisma.contributedDriver.count({ where });
    const overallCount = await prisma.contributedDriver.count({ where: { isApproved: true } });

    // Strip raw contributorPhone for privacy and include contributorHash
    const safeDrivers = drivers.map((d) => {
      const { contributorPhone, ...rest } = d;
      return {
        ...rest,
        contributorHash: contributorPhone ? getPhoneHash(contributorPhone) : null,
      };
    });

    return NextResponse.json(safeDrivers, {
      headers: {
        "X-Total-Count": totalCount.toString(),
        "X-Overall-Count": overallCount.toString(),
      },
    });
  } catch (error) {
    console.error("Fetch contributed drivers error:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contributedDriverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { name, phone, address, nearbyBazar, vehicleType, contributorName, contributorPhone, contributorPhotoUrl } = result.data;

    // Check uniqueness across ContributedDriver
    const existingContributed = await prisma.contributedDriver.findUnique({
      where: { phone }
    });

    if (existingContributed) {
      return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });
    }

    // Determine current session
    const session = await getAuthUser();
    let effectiveContributorName = contributorName;
    let effectiveContributorPhone = contributorPhone;
    let effectiveContributorPhotoUrl = contributorPhotoUrl;
    let autoLoggedIn = false;

    if (session) {
      let dbUserOrDriver = null;
      if (session.role === "USER" || session.role === "ADMIN") {
        dbUserOrDriver = await prisma.user.findUnique({
          where: { id: session.sub },
          select: { name: true, phone: true, photoUrl: true }
        });
      } else if (session.role === "DRIVER") {
        dbUserOrDriver = await prisma.driver.findUnique({
          where: { id: session.sub },
          select: { name: true, phone: true, photoUrl: true }
        });
      }
      if (dbUserOrDriver) {
        effectiveContributorName = dbUserOrDriver.name;
        effectiveContributorPhone = dbUserOrDriver.phone;
        effectiveContributorPhotoUrl = dbUserOrDriver.photoUrl || undefined;
      }
    } else {
      // Not logged in: auto-login ONLY if it's a newly created user
      const normalizedContPhone = normalizePhone(contributorPhone || "");
      if (normalizedContPhone) {
        const user = await prisma.user.findUnique({
          where: { phone: normalizedContPhone }
        });

        if (user) {
          // If user exists, block addition and prompt to login first
          return NextResponse.json({ error: "CONTRIBUTOR_PHONE_EXISTS" }, { status: 400 });
        }

        // Create new user
        const newUser = await prisma.user.create({
          data: {
            phone: normalizedContPhone,
            name: contributorName || "User",
            photoUrl: contributorPhotoUrl || null,
            passwordHash: null,
          }
        });

        const token = await signToken({
          sub: newUser.id,
          role: newUser.role as "DRIVER" | "USER" | "ADMIN",
        });

        await setAuthCookie(token, request.headers.get("host"));
        autoLoggedIn = true;
      }
    }

    // Check system setting for auto approve
    const autoApproveSetting = await getSystemSetting("AUTO_APPROVE_CONTRIBUTED_DRIVERS", "true");
    const isApproved = autoApproveSetting === "true";

    const driver = await prisma.contributedDriver.create({
      data: {
        name,
        phone,
        address: address || null,
        nearbyBazar,
        vehicleType,
        isApproved,
        contributorName: effectiveContributorName,
        contributorPhone: effectiveContributorPhone,
        contributorPhotoUrl: effectiveContributorPhotoUrl || null
      }
    });

    return NextResponse.json({ driver, autoApproved: isApproved, autoLoggedIn });
  } catch (error) {
    console.error("Create contributed driver error:", error);
    return NextResponse.json({ error: "Failed to contribute driver" }, { status: 500 });
  }
}
