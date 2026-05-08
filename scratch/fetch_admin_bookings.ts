import { prisma } from "../lib/prisma";
import { signToken } from "../lib/auth";

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.log("No admin found");
    return;
  }
  
  const token = await signToken({
    sub: admin.id,
    phone: admin.phone,
    role: admin.role as "ADMIN",
  } as any);

  const res = await fetch("http://localhost:3000/api/user/bookings", {
    headers: {
      "Cookie": `auth_token=${token}`
    }
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data length:", data.bookings?.length);
  console.dir(data, { depth: null });
}

run().catch(console.error).finally(() => prisma.$disconnect());
