import { messagingAdmin } from "./lib/firebase-admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPush() {
  if (!messagingAdmin) {
    console.error("messagingAdmin is null! Check your FIREBASE environment variables in .env.local");
    return;
  }
  
  // Retrieve the latest driver token dynamically
  const latestTokenRecord = await prisma.driverPushToken.findFirst({
    orderBy: { createdAt: "desc" },
    include: { driver: true }
  });

  if (!latestTokenRecord) {
    console.error("No driver push tokens found in the database. Please go online on the driver dashboard first!");
    return;
  }

  const token = latestTokenRecord.token;
  console.log(`Retrieved latest token from DB for driver ${latestTokenRecord.driver.name}:`, token);
  
  const message = {
    notification: {
      title: "টেস্ট পুশ নোটিফিকেশন 🛺",
      body: "এটি একটি টেস্ট নোটিফিকেশন।",
    },
    token: token
  };

  try {
    console.log("Attempting to send push to:", token);
    const response = await messagingAdmin.send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.warn("\n[Expected behavior in local development with mock tokens]");
    console.error("Error sending message:", error);
  }
}

testPush()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

