import { Inject, Injectable } from "@nestjs/common";

import { AccountRepository } from "./account.repository";
import { IDENTITY_GATEWAY, type IdentityGateway } from "./identity.gateway";

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IDENTITY_GATEWAY) private readonly gateway: IdentityGateway,
    private readonly accounts: AccountRepository
  ) {}

  async resolveAccount(token: string): Promise<string> {
    const { subject } = await this.gateway.verifyAccessToken(token);
    return this.accounts.resolveSupabaseSubject(subject);
  }
}
