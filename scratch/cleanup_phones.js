const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizePhone(phone) {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

async function main() {
  try {
    const drivers = await prisma.driver.findMany();
    let updatedDrivers = 0;
    for (const driver of drivers) {
      if (driver.phone !== '__perf_test_driver__' && driver.phone !== '__pres_race_drv1__' && driver.phone !== '__pres_race_drv2__') {
        const newPhone = normalizePhone(driver.phone);
        if (newPhone !== driver.phone) {
          console.log(`Driver ID ${driver.id}: '${driver.phone}' -> '${newPhone}'`);
          await prisma.driver.update({
            where: { id: driver.id },
            data: { phone: newPhone }
          });
          updatedDrivers++;
        }
      }
    }

    const users = await prisma.user.findMany();
    let updatedUsers = 0;
    for (const user of users) {
      if (user.phone !== '__perf_test_user__' && user.phone !== '__pres_race_user1__' && user.phone !== '__pres_race_user2__') {
        const newPhone = normalizePhone(user.phone);
        if (newPhone && newPhone !== user.phone) {
          console.log(`User ID ${user.id}: '${user.phone}' -> '${newPhone}'`);
          await prisma.user.update({
            where: { id: user.id },
            data: { phone: newPhone }
          });
          updatedUsers++;
        }
      }
    }

    console.log(`Finished. Updated ${updatedDrivers} drivers and ${updatedUsers} users.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
