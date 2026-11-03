import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveSupabaseSubject(subject: string): Promise<string> {
    const existing = await this.prisma.authIdentity.findUnique({
      where: { provider_subject: { provider: "supabase", subject } },
      select: { accountId: true, account: { select: { deletedAt: true } } }
    });
    if (existing) {
      if (existing.account.deletedAt) throw new UnauthorizedException();
      return existing.accountId;
    }

    try {
      const account = await this.prisma.account.create({
        data: { identities: { create: { provider: "supabase", subject } } },
        select: { id: true }
      });
      return account.id;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      const raced = await this.prisma.authIdentity.findUnique({
        where: { provider_subject: { provider: "supabase", subject } },
        select: { accountId: true, account: { select: { deletedAt: true } } }
      });
      if (!raced) throw error;
      if (raced.account.deletedAt) throw new UnauthorizedException();
      return raced.accountId;
    }
  }
}
