import { randomUUID } from "node:crypto";

import { PrismaClient } from "../generated/prisma";

const databaseUrl = process.env.DATABASE_POOL_URL;
if (!databaseUrl || !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\//.test(databaseUrl)) {
  throw new Error("Integration tests require a local PostgreSQL DATABASE_POOL_URL");
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

afterAll(async () => {
  await prisma.$disconnect();
});

it("persists a synthetic account, consent and child with scoped membership", async () => {
  const subject = `test-${randomUUID()}`;
  const account = await prisma.account.create({ data: {} });
  const family = await prisma.family.create({ data: {} });
  try {
    await prisma.authIdentity.create({
      data: { accountId: account.id, provider: "test", subject }
    });
    await prisma.familyMember.create({
      data: { accountId: account.id, familyId: family.id, role: "owner" }
    });
    await prisma.consentRecord.create({
      data: { accountId: account.id, documentVersion: "test-v1", scope: "child_profile" }
    });
    const child = await prisma.childProfile.create({
      data: { familyId: family.id, displayName: "Bé Mẫu", birthYear: 2022, birthMonth: 6 }
    });

    const loaded = await prisma.family.findUniqueOrThrow({
      where: { id: family.id },
      include: { members: true, children: true }
    });
    expect(loaded.members).toHaveLength(1);
    expect(loaded.children[0]?.id).toBe(child.id);

    await expect(
      prisma.childProfile.create({
        data: { familyId: family.id, displayName: "Invalid", birthMonth: 13 }
      })
    ).rejects.toThrow();
    await expect(
      prisma.authIdentity.create({
        data: { accountId: account.id, provider: "test", subject }
      })
    ).rejects.toThrow();
  } finally {
    await prisma.childProfile.deleteMany({ where: { familyId: family.id } });
    await prisma.consentRecord.deleteMany({ where: { accountId: account.id } });
    await prisma.familyMember.deleteMany({ where: { familyId: family.id } });
    await prisma.authIdentity.deleteMany({ where: { accountId: account.id } });
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.account.delete({ where: { id: account.id } });
  }
});
