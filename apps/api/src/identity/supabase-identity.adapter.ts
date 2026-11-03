import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

import type { IdentityGateway } from "./identity.gateway";

@Injectable()
export class SupabaseIdentityAdapter implements IdentityGateway {
  private jwks?: JWTVerifyGetKey;

  async verifyAccessToken(token: string): Promise<{ subject: string }> {
    const issuer = process.env.SUPABASE_JWT_ISSUER;
    const audience = process.env.SUPABASE_JWT_AUDIENCE;
    const jwksUrl = process.env.SUPABASE_JWKS_URL;
    if (!issuer || !audience || !jwksUrl) throw new Error("Supabase JWT configuration missing");
    const url = new URL(jwksUrl);
    const localLoopback =
      process.env.APP_ENV === "local" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        (url.hostname === "identity" && url.port === "3011" && url.pathname === "/jwks"));
    if (url.protocol !== "https:" && !localLoopback) {
      throw new Error("SUPABASE_JWKS_URL must use HTTPS");
    }
    this.jwks ??= createRemoteJWKSet(url, { timeoutDuration: 5000 });
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer,
        audience,
        algorithms: ["ES256", "RS256"],
        requiredClaims: ["sub", "exp", "iat"]
      });
      if (!payload.sub || payload.sub.length > 255 || payload.role !== "authenticated") {
        throw new UnauthorizedException();
      }
      return { subject: payload.sub };
    } catch {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
  }
}
