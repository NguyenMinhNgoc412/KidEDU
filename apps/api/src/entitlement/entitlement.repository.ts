import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class EntitlementRepository {
  constructor(private readonly prisma: PrismaService) {}

  getForAccount(accountId: string) {
    return this.prisma.entitlement.findUnique({
      where: { accountId },
      select: {
        state: true,
        effectiveUntil: true,
        capabilities: true,
        billingRetryAllowsAccess: true,
        version: true,
        updatedAt: true
      }
    });
  }
}
