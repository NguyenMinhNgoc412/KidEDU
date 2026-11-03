import { createServer } from "node:http";

import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { SupabaseIdentityAdapter } from "../src/identity/supabase-identity.adapter";

describe("SupabaseIdentityAdapter transport", () => {
  it("accepts only a signed authenticated user token", async () => {
    const prior = {
      appEnv: process.env.APP_ENV,
      issuer: process.env.SUPABASE_JWT_ISSUER,
      audience: process.env.SUPABASE_JWT_AUDIENCE,
      jwks: process.env.SUPABASE_JWKS_URL
    };
    const keys = await generateKeyPair("RS256");
    const publicJwk = await exportJWK(keys.publicKey);
    publicJwk.kid = "role-test-key";
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ keys: [publicJwk] }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("JWKS server did not bind");
      process.env.APP_ENV = "local";
      process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${address.port}/jwks`;
      process.env.SUPABASE_JWT_ISSUER = "https://identity.example.test/auth/v1";
      process.env.SUPABASE_JWT_AUDIENCE = "authenticated";
      const adapter = new SupabaseIdentityAdapter();
      const signToken = (role: string) =>
        new SignJWT({ role })
          .setProtectedHeader({ alg: "RS256", kid: "role-test-key" })
          .setIssuer(process.env.SUPABASE_JWT_ISSUER!)
          .setAudience("authenticated")
          .setSubject("parent-id")
          .setIssuedAt()
          .setExpirationTime("5m")
          .sign(keys.privateKey);
      await expect(adapter.verifyAccessToken(await signToken("authenticated"))).resolves.toEqual({
        subject: "parent-id"
      });
      await expect(adapter.verifyAccessToken(await signToken("anon"))).rejects.toThrow();
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      for (const [key, value] of Object.entries({
        APP_ENV: prior.appEnv,
        SUPABASE_JWT_ISSUER: prior.issuer,
        SUPABASE_JWT_AUDIENCE: prior.audience,
        SUPABASE_JWKS_URL: prior.jwks
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
  it("rejects an HTTP JWKS endpoint in production even when it points to loopback", async () => {
    const previous = {
      appEnv: process.env.APP_ENV,
      issuer: process.env.SUPABASE_JWT_ISSUER,
      audience: process.env.SUPABASE_JWT_AUDIENCE,
      jwks: process.env.SUPABASE_JWKS_URL
    };
    process.env.APP_ENV = "production";
    process.env.SUPABASE_JWT_ISSUER = "https://identity.example.test/auth/v1";
    process.env.SUPABASE_JWT_AUDIENCE = "authenticated";
    process.env.SUPABASE_JWKS_URL = "http://127.0.0.1:4000/jwks.json";
    try {
      await expect(new SupabaseIdentityAdapter().verifyAccessToken("invalid")).rejects.toThrow(
        "SUPABASE_JWKS_URL must use HTTPS"
      );
    } finally {
      for (const [key, value] of Object.entries({
        APP_ENV: previous.appEnv,
        SUPABASE_JWT_ISSUER: previous.issuer,
        SUPABASE_JWT_AUDIENCE: previous.audience,
        SUPABASE_JWKS_URL: previous.jwks
      })) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
