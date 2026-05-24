import { PrismaClient } from "@prisma/client";
import { getBoundingBox } from "./lib/radius";

const prisma = new PrismaClient();

async function main() {
  const pickupLat = 23.10183714999999;
  const pickupLng = 91.48642729999997;
  const searchRadiusKm = 3;
  const minBalance = -100;

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
    pickupLat,
    pickupLng,
    searchRadiusKm
  );

  console.log("Bounding box:", { minLat, maxLat, minLng, maxLng });

  // 1. Let's fetch all drivers and log their raw eligibility properties
  const drivers = await prisma.driver.findMany({
    include: {
      wallet: true,
      pushToken: true,
    }
  });

  console.log("\n--- Raw Drivers in DB ---");
  for (const d of drivers) {
    const activeBookingsCount = await prisma.booking.count({
      where: {
        driverId: d.id,
        status: { in: ['ACCEPTED', 'ARRIVED', 'PICKED_UP'] }
      }
    });

    console.log(`Driver: ${d.name}`);
    console.log(`- isOnline: ${d.isOnline}`);
    console.log(`- isApproved: ${d.isApproved}`);
    console.log(`- isSuspended: ${d.isSuspended}`);
    console.log(`- lat/lng: ${d.currentLat}, ${d.currentLng}`);
    console.log(`- has token: ${d.pushToken ? d.pushToken.token : 'NONE'}`);
    console.log(`- wallet balance: ${d.wallet?.balance ?? 'NULL'}`);
    console.log(`- active bookings count: ${activeBookingsCount}`);
  }

  // 2. Run the exact query to see if it matches
  console.log("\n--- Running exact $queryRaw matching ---");
  try {
    const nearbyDrivers = await prisma.$queryRaw<{ id: string; pushToken: string }[]>`
      SELECT 
        d."id",
        pt."token" AS "pushToken"
      FROM "Driver" d
      LEFT JOIN "DriverWallet" w ON w."driverId" = d."id"
      LEFT JOIN "DriverPushToken" pt ON pt."driverId" = d."id"
      WHERE 
        d."isOnline" = true
        AND d."isApproved" = true
        AND d."isSuspended" = false
        AND d."currentLat" BETWEEN ${minLat} AND ${maxLat}
        AND d."currentLng" BETWEEN ${minLng} AND ${maxLng}
        AND pt."token" IS NOT NULL
        AND (w."balance" IS NULL OR w."balance" > ${minBalance})
        AND NOT EXISTS (
          SELECT 1 FROM "Booking" b 
          WHERE b."driverId" = d."id" 
            AND b."status" IN ('ACCEPTED', 'ARRIVED', 'PICKED_UP')
        )
        AND ST_DWithin(
          ST_MakePoint(d."currentLng", d."currentLat")::geography,
          ST_MakePoint(${Number(pickupLng)}::float8, ${Number(pickupLat)}::float8)::geography,
          ${searchRadiusKm * 1000}::float8
        )
    `;
    console.log("Matched Drivers count:", nearbyDrivers.length);
    console.log("Matched Drivers list:", JSON.stringify(nearbyDrivers, null, 2));
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
