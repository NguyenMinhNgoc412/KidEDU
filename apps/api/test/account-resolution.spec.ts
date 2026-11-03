import { UnauthorizedException } from "@nestjs/common";

import type { PrismaService } from "../src/database/prisma.service";
import { AccountRepository } from "../src/identity/account.repository";

describe("internal account resolution", () => {
  it("rejects a valid provider subject linked to a deleted account", async () => {
    const db = {
      authIdentity: {
        findUnique: jest.fn().mockResolvedValue({
          accountId: "11111111-1111-4111-8111-111111111111",
          account: { deletedAt: new Date() }
        })
      },
      account: { create: jest.fn() }
    };
    const repository = new AccountRepository(db as unknown as PrismaService);
    await expect(repository.resolveSupabaseSubject("subject-1")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(db.account.create).not.toHaveBeenCalled();
  });
});
