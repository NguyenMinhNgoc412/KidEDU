import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../src/database/prisma.service";
import { FamilyRepository } from "../src/families/family.repository";
import { FamilyService } from "../src/families/family.service";

const childId = "11111111-1111-4111-8111-111111111111";
const accountId = "22222222-2222-4222-8222-222222222222";
const profile = {
  id: childId,
  familyId: "33333333-3333-4333-8333-333333333333",
  displayName: "Bé Mẫu",
  birthYear: 2022,
  birthMonth: 6,
  version: 2
};

function setup() {
  const db = {
    childProfile: {
      findFirst: jest.fn().mockResolvedValue(profile),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    family: { findMany: jest.fn().mockResolvedValue([]) }
  };
  const repository = new FamilyRepository(db as unknown as PrismaService);
  return { db, repository, service: new FamilyService(repository) };
}

describe("child profile API policy", () => {
  it("returns 404 and never writes when the child is outside the account family", async () => {
    const { db, service } = setup();
    db.childProfile.findFirst.mockResolvedValue(null);
    await expect(
      service.updateChild(accountId, childId, { expectedVersion: 2, displayName: "Tên khác" })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.childProfile.updateMany).not.toHaveBeenCalled();
  });

  it("checks the expected version in the write query", async () => {
    const { db, service } = setup();
    db.childProfile.findFirst.mockResolvedValueOnce(profile).mockResolvedValueOnce({
      ...profile,
      displayName: "Tên mới",
      version: 3
    });
    const updated = await service.updateChild(accountId, childId, {
      expectedVersion: 2,
      displayName: "Tên mới"
    });
    expect(updated.version).toBe(3);
    expect(db.childProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: childId,
          version: 2,
          family: { deletedAt: null, members: { some: { accountId } } }
        }),
        data: { displayName: "Tên mới", version: { increment: 1 } }
      })
    );
  });

  it("rejects stale updates and invalid partial birth dates", async () => {
    const { db, service } = setup();
    await expect(
      service.updateChild(accountId, childId, { expectedVersion: 1, displayName: "Tên mới" })
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.updateChild(accountId, childId, { expectedVersion: 2, birthYear: null })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.childProfile.updateMany).not.toHaveBeenCalled();
  });

  it("hides family records outside the membership filter", async () => {
    const { db, repository } = setup();
    await repository.listFamilies(accountId);
    expect(db.family.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null, members: { some: { accountId } } } })
    );
  });
});
