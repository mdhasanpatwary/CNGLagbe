import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import DirectoryPageClient from "@/components/directory/DirectoryPageClient";

function getPhoneHash(phone: string): string {
  return createHash("sha256").update(phone).digest("hex");
}

export default async function Page() {
  const session = await getAuthUser();
  let user = null;

  if (session) {
    let userData = null;
    if (session.role === "USER" || session.role === "ADMIN") {
      userData = await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          photoUrl: true,
          birthday: true,
          createdAt: true,
        },
      });
    } else if (session.role === "DRIVER") {
      userData = await prisma.driver.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          name: true,
          phone: true,
          photoUrl: true,
          isApproved: true,
          isSuspended: true,
          isOnline: true,
          vehicleNumber: true,
          vehicleType: true,
          nearbyBazar: true,
          address: true,
          birthday: true,
          nidNumber: true,
          licenseNumber: true,
          createdAt: true,
        },
      });
    }

    if (userData) {
      user = {
        ...userData,
        role: session.role,
        phoneHash: userData.phone ? getPhoneHash(userData.phone) : null,
        createdAt: userData.createdAt.toISOString(),
        birthday: userData.birthday ? userData.birthday.toISOString() : null,
      };
    }
  }

  return <DirectoryPageClient initialUser={user} />;
}
