const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.log("No admin found");
    return;
  }
  
  const token = jwt.sign({
    sub: admin.id,
    phone: admin.phone,
    role: admin.role,
  }, JWT_SECRET, { expiresIn: '7d' });

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
