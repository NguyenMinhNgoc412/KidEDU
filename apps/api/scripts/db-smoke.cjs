const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();
prisma.account
  .count()
  .then((count) => {
    process.stdout.write(`Database query OK; account count ${count}\n`);
  })
  .catch((error) => {
    process.stderr.write(`Database query failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
