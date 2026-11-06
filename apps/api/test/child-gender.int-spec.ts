import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma";
import type { PrismaService } from "../src/database/prisma.service";
import { FamilyRepository } from "../src/families/family.repository";

const url = process.env.DATABASE_POOL_URL;
if (
  !url ||
  !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\/kidedu_c50_test(?:\?|$)/.test(url)
) {
  throw new Error("C50 integration requires the isolated local kidedu_c50_test database");
}
const prisma = new PrismaClient({ datasources: { db: { url } } });
const repository = new FamilyRepository(prisma as unknown as PrismaService);
afterAll(async () => prisma.$disconnect());

it("preserves legacy null, isolates families and commits only one concurrent initial choice", async () => {
  const account = await prisma.account.create({ data: {} });
  const outsider = await prisma.account.create({ data: {} });
  const family = await prisma.family.create({
    data: { members: { create: { accountId: account.id, role: "owner" } } }
  });
  try {
    await prisma.consentRecord.create({
      data: { accountId: account.id, documentVersion: "c50-test-v1", scope: "child_profile" }
    });
    const explicitlyEntered = await repository.createChild(
      account.id,
      {
        familyId: family.id,
        displayName: "Synthetic new profile",
        gender: "girl"
      },
      "c50-test-v1"
    );
    expect(explicitlyEntered.gender).toBe("girl");
    const child = await prisma.childProfile.create({
      data: { familyId: family.id, displayName: "Synthetic C50" }
    });
    expect(child.gender).toBeNull();
    expect((await repository.getChild(account.id, child.id)).gender).toBeNull();
    await expect(
      repository.updateChild(outsider.id, child.id, { expectedVersion: 1, gender: "boy" })
    ).rejects.toBeInstanceOf(NotFoundException);
    const results = await Promise.allSettled([
      repository.updateChild(account.id, child.id, { expectedVersion: 1, gender: "boy" }),
      repository.updateChild(account.id, child.id, { expectedVersion: 1, gender: "girl" })
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(ConflictException);
    const saved = await repository.getChild(account.id, child.id);
    expect(saved.version).toBe(2);
    expect(["boy", "girl"]).toContain(saved.gender);
    const renamed = await repository.updateChild(account.id, child.id, {
      expectedVersion: 2,
      displayName: "Another synthetic name"
    });
    expect(renamed.gender).toBe(saved.gender);
    await expect(
      repository.updateChild(account.id, child.id, {
        expectedVersion: 3,
        gender: saved.gender === "boy" ? "girl" : "boy"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    // Legacy reader still selects its original fields after the additive migration.
    expect(
      await prisma.childProfile.findUnique({
        where: { id: child.id },
        select: { displayName: true, version: true }
      })
    ).toEqual({ displayName: "Another synthetic name", version: 3 });
  } finally {
    await prisma.childProfile.deleteMany({ where: { familyId: family.id } });
    await prisma.familyMember.deleteMany({ where: { familyId: family.id } });
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.consentRecord.deleteMany({ where: { accountId: account.id } });
    await prisma.account.deleteMany({ where: { id: { in: [account.id, outsider.id] } } });
  }
});
