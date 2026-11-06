import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { z } from "zod";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class FamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFamily(accountId: string) {
    const family = await this.prisma.family.create({
      data: { members: { create: { accountId, role: "owner" } } },
      select: { id: true }
    });
    return family;
  }

  async listFamilies(accountId: string) {
    const rows = await this.prisma.family.findMany({
      where: { deletedAt: null, members: { some: { accountId } } },
      select: { id: true, members: { where: { accountId }, select: { role: true } } },
      orderBy: { createdAt: "asc" }
    });
    return rows.flatMap((row) =>
      row.members[0] ? [{ id: row.id, role: row.members[0].role }] : []
    );
  }

  async grantChildProfileConsent(accountId: string, documentVersion: string) {
    const record = await this.prisma.consentRecord.create({
      data: { accountId, documentVersion, scope: "child_profile" },
      select: { id: true, documentVersion: true, grantedAt: true }
    });
    return record;
  }

  async revokeChildProfileConsent(accountId: string, documentVersion: string) {
    const result = await this.prisma.consentRecord.updateMany({
      where: { accountId, documentVersion, scope: "child_profile", revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return { revokedCount: result.count };
  }

  async listConsents(accountId: string) {
    return this.prisma.consentRecord.findMany({
      where: { accountId, scope: "child_profile" },
      select: { id: true, scope: true, documentVersion: true, grantedAt: true, revokedAt: true },
      orderBy: { grantedAt: "desc" }
    });
  }

  async createChild(
    accountId: string,
    input: {
      familyId: string;
      displayName: string;
      gender?: "boy" | "girl";
      birthYear?: number;
      birthMonth?: number;
    },
    consentVersion: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.familyMember.findFirst({
        where: { familyId: input.familyId, accountId, family: { deletedAt: null } },
        select: { id: true }
      });
      if (!member) throw new NotFoundException();
      const consent = await tx.consentRecord.findFirst({
        where: {
          accountId,
          scope: "child_profile",
          documentVersion: consentVersion,
          revokedAt: null
        },
        select: { id: true }
      });
      if (!consent)
        throw new ForbiddenException("Cần đồng ý chính sách dữ liệu trước khi tạo hồ sơ.");
      return tx.childProfile.create({
        data: input,
        select: {
          id: true,
          familyId: true,
          displayName: true,
          gender: true,
          birthYear: true,
          birthMonth: true,
          version: true
        }
      });
    });
  }

  async listChildren(accountId: string) {
    return this.prisma.childProfile.findMany({
      where: { deletedAt: null, family: { deletedAt: null, members: { some: { accountId } } } },
      select: {
        id: true,
        familyId: true,
        displayName: true,
        gender: true,
        birthYear: true,
        birthMonth: true,
        version: true
      },
      orderBy: { createdAt: "asc" }
    });
  }

  async getChild(accountId: string, childId: string) {
    if (!z.uuid().safeParse(childId).success) throw new NotFoundException();
    const child = await this.prisma.childProfile.findFirst({
      where: {
        id: childId,
        deletedAt: null,
        family: { deletedAt: null, members: { some: { accountId } } }
      },
      select: {
        id: true,
        familyId: true,
        displayName: true,
        gender: true,
        birthYear: true,
        birthMonth: true,
        version: true
      }
    });
    if (!child) throw new NotFoundException();
    return child;
  }

  async updateChild(
    accountId: string,
    childId: string,
    input: {
      expectedVersion: number;
      displayName?: string;
      gender?: "boy" | "girl";
      birthYear?: number | null;
      birthMonth?: number | null;
    }
  ) {
    const current = await this.getChild(accountId, childId);
    // D05 only authorizes initial entry. Correction policy is still owner-gated.
    if (input.gender !== undefined && current.gender != null && input.gender !== current.gender) {
      throw new ConflictException("Giới tính đã được lưu. Không thể thay đổi trong thao tác này.");
    }
    const birthYear = input.birthYear === undefined ? current.birthYear : input.birthYear;
    const birthMonth = input.birthMonth === undefined ? current.birthMonth : input.birthMonth;
    if (birthMonth !== null && birthYear === null) {
      throw new BadRequestException("Tháng sinh cần đi cùng năm sinh.");
    }
    if (current.version !== input.expectedVersion) throw new ConflictException();
    const updated = await this.prisma.childProfile.updateMany({
      where: {
        id: childId,
        version: input.expectedVersion,
        deletedAt: null,
        family: { deletedAt: null, members: { some: { accountId } } }
      },
      data: {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.birthYear !== undefined ? { birthYear: input.birthYear } : {}),
        ...(input.birthMonth !== undefined ? { birthMonth: input.birthMonth } : {}),
        version: { increment: 1 }
      }
    });
    if (updated.count !== 1) throw new ConflictException();
    return this.getChild(accountId, childId);
  }
}
