export const IDENTITY_GATEWAY = Symbol("IDENTITY_GATEWAY");

export interface IdentityGateway {
  verifyAccessToken(token: string): Promise<{ subject: string }>;
}
