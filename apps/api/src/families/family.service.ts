import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";

import { FamilyRepository } from "./family.repository";

const childInputSchema = z
  .strictObject({
    familyId: z.uuid(),
    displayName: z.string().trim().min(1).max(80),
    // Optional on v1 for older clients; current UI requires an explicit choice.
    gender: z.enum(["boy", "girl"]).optional(),
    birthYear: z.number().int().min(1900).max(new Date().getUTCFullYear()).optional(),
    birthMonth: z.number().int().min(1).max(12).optional()
  })
  .refine((value) => value.birthMonth === undefined || value.birthYear !== undefined);

const childUpdateSchema = z
  .strictObject({
    expectedVersion: z.number().int().positive(),
    displayName: z.string().trim().min(1).max(80).optional(),
    gender: z.enum(["boy", "girl"]).optional(),
    birthYear: z.number().int().min(1900).max(new Date().getUTCFullYear()).nullable().optional(),
    birthMonth: z.number().int().min(1).max(12).nullable().optional()
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.gender !== undefined ||
      value.birthYear !== undefined ||
      value.birthMonth !== undefined
  );

const consentInputSchema = z.strictObject({
  scope: z.literal("child_profile"),
  documentVersion: z.string().trim().min(1).max(80),
  action: z.enum(["grant", "revoke"]),
  attestsGuardian: z.literal(true)
});

@Injectable()
export class FamilyService {
  constructor(private readonly repository: FamilyRepository) {}

  createFamily(accountId: string) {
    return this.repository.createFamily(accountId);
  }

  listFamilies(accountId: string) {
    return this.repository.listFamilies(accountId);
  }

  async recordConsent(accountId: string, body: unknown) {
    const parsed = consentInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Thông tin đồng ý không hợp lệ.");
    const expectedVersion = process.env.CHILD_PROFILE_CONSENT_VERSION;
    if (!expectedVersion) throw new Error("CHILD_PROFILE_CONSENT_VERSION missing");
    if (parsed.data.documentVersion !== expectedVersion) {
      throw new BadRequestException("Phiên bản chính sách không còn hiệu lực.");
    }
    return parsed.data.action === "grant"
      ? this.repository.grantChildProfileConsent(accountId, expectedVersion)
      : this.repository.revokeChildProfileConsent(accountId, expectedVersion);
  }

  listConsents(accountId: string) {
    return this.repository.listConsents(accountId);
  }

  async createChild(accountId: string, body: unknown) {
    const parsed = childInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Hồ sơ trẻ không hợp lệ.");
    const consentVersion = process.env.CHILD_PROFILE_CONSENT_VERSION;
    if (!consentVersion) throw new Error("CHILD_PROFILE_CONSENT_VERSION missing");
    return this.repository.createChild(accountId, parsed.data, consentVersion);
  }

  listChildren(accountId: string) {
    return this.repository.listChildren(accountId);
  }

  getChild(accountId: string, childId: string) {
    return this.repository.getChild(accountId, childId);
  }

  updateChild(accountId: string, childId: string, body: unknown) {
    const parsed = childUpdateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Hồ sơ trẻ không hợp lệ.");
    return this.repository.updateChild(accountId, childId, parsed.data);
  }
}
