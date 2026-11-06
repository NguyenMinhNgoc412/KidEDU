import { NotFoundException } from "@nestjs/common";
import type { Prisma } from "../../generated/prisma";

export async function lockDailyGameChild(
  tx: Prisma.TransactionClient,
  accountId: string,
  childId: string
) {
  const rows = await tx.$queryRaw<{ id: string; gender: "boy" | "girl" | null }[]>`
    SELECT c.id, c.gender FROM child_profiles c
    JOIN families f ON f.id = c.family_id
    JOIN family_members m ON m.family_id = f.id
    WHERE c.id = ${childId}::uuid AND m.account_id = ${accountId}::uuid
      AND c.deleted_at IS NULL AND f.deleted_at IS NULL
    FOR UPDATE OF c`;
  if (rows.length === 0) throw new NotFoundException("Child not found");
  return rows[0]!;
}
