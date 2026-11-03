import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";

import { PrismaClient } from "../generated/prisma";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import request from "supertest";

import { createApp } from "../src/main";

const databaseUrl = process.env.DATABASE_POOL_URL;
if (!databaseUrl || !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):\d+\//.test(databaseUrl)) {
  throw new Error("Integration tests require a local PostgreSQL DATABASE_POOL_URL");
}

describe("GET /v1/me", () => {
  const previousAppEnv = process.env.APP_ENV;
  const subject = randomUUID();
  const issuer = "https://identity.test.local/auth/v1";
  const audience = "authenticated";
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  let jwksServer: Server;
  let app: Awaited<ReturnType<typeof createApp>>;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
  let accountId: string | undefined;
  let otherAccountId: string | undefined;
  let familyId: string | undefined;

  beforeAll(async () => {
    process.env.APP_ENV = "local";
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    const publicJwk = await exportJWK(pair.publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "RS256";
    jwksServer = createServer((_req, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ keys: [publicJwk] }));
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, "127.0.0.1", resolve));
    const address = jwksServer.address();
    if (!address || typeof address === "string") throw new Error("JWKS server did not bind");
    process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${address.port}/jwks.json`;
    process.env.SUPABASE_JWT_ISSUER = issuer;
    process.env.SUPABASE_JWT_AUDIENCE = audience;
    process.env.CHILD_PROFILE_CONSENT_VERSION = "test-v1";
    app = await createApp();
  });

  afterAll(async () => {
    await app?.close();
    if (accountId) {
      if (familyId) {
        await prisma.childProfile.deleteMany({ where: { familyId } });
        await prisma.familyMember.deleteMany({ where: { familyId } });
        await prisma.family.delete({ where: { id: familyId } });
      }
      await prisma.consentRecord.deleteMany({ where: { accountId } });
      await prisma.authIdentity.deleteMany({ where: { accountId } });
      await prisma.account.delete({ where: { id: accountId } });
    }
    if (otherAccountId) {
      await prisma.consentRecord.deleteMany({ where: { accountId: otherAccountId } });
      await prisma.authIdentity.deleteMany({ where: { accountId: otherAccountId } });
      await prisma.account.delete({ where: { id: otherAccountId } });
    }
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve()))
    );
    delete process.env.SUPABASE_JWKS_URL;
    delete process.env.SUPABASE_JWT_ISSUER;
    delete process.env.SUPABASE_JWT_AUDIENCE;
    delete process.env.CHILD_PROFILE_CONSENT_VERSION;
    if (previousAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = previousAppEnv;
  });

  async function tokenWithAudience(
    tokenAudience: string,
    tokenSubject = subject,
    role = "authenticated"
  ) {
    return new SignJWT({ role })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(issuer)
      .setAudience(tokenAudience)
      .setSubject(tokenSubject)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  }

  it("rejects missing and mismatched credentials with a safe envelope", async () => {
    const missing = await request(app.getHttpServer()).get("/v1/me");
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe("UNAUTHENTICATED");
    expect(missing.body.error.requestId).toBe(missing.headers["x-request-id"]);

    const wrongAudience = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${await tokenWithAudience("wrong")}`);
    expect(wrongAudience.status).toBe(401);

    const wrongRole = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${await tokenWithAudience(audience, subject, "anon")}`);
    expect(wrongRole.status).toBe(401);
  });

  it("maps a verified provider subject to one stable internal account", async () => {
    const token = await tokenWithAudience(audience);
    const first = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${token}`);
    const second = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Bearer ${token}`);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.body.id).toBe(first.body.id);
    accountId = first.body.id;
    expect(await prisma.authIdentity.count({ where: { provider: "supabase", subject } })).toBe(1);
  });

  it("requires current guardian consent and family membership before creating a child", async () => {
    const token = await tokenWithAudience(audience);
    const authorization = `Bearer ${token}`;
    const family = await request(app.getHttpServer())
      .post("/v1/families")
      .set("Authorization", authorization);
    expect(family.status).toBe(201);
    familyId = family.body.id;

    const child = { familyId, displayName: "Bé Mẫu", birthYear: 2022, birthMonth: 6 };
    const beforeConsent = await request(app.getHttpServer())
      .post("/v1/children")
      .set("Authorization", authorization)
      .send(child);
    expect(beforeConsent.status).toBe(403);

    const wrongVersion = await request(app.getHttpServer())
      .post("/v1/consents")
      .set("Authorization", authorization)
      .send({
        scope: "child_profile",
        documentVersion: "old",
        action: "grant",
        attestsGuardian: true
      });
    expect(wrongVersion.status).toBe(400);

    const grant = await request(app.getHttpServer())
      .post("/v1/consents")
      .set("Authorization", authorization)
      .send({
        scope: "child_profile",
        documentVersion: "test-v1",
        action: "grant",
        attestsGuardian: true
      });
    expect(grant.status).toBe(201);

    const created = await request(app.getHttpServer())
      .post("/v1/children")
      .set("Authorization", authorization)
      .send(child);
    expect(created.status).toBe(201);
    expect(created.body.displayName).toBe(child.displayName);
    const listed = await request(app.getHttpServer())
      .get("/v1/children")
      .set("Authorization", authorization);
    expect(listed.body.map((item: { id: string }) => item.id)).toContain(created.body.id);

    const otherToken = await tokenWithAudience(audience, randomUUID());
    const otherAuthorization = `Bearer ${otherToken}`;
    const otherMe = await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", otherAuthorization);
    otherAccountId = otherMe.body.id;
    const otherGrant = await request(app.getHttpServer())
      .post("/v1/consents")
      .set("Authorization", otherAuthorization)
      .send({
        scope: "child_profile",
        documentVersion: "test-v1",
        action: "grant",
        attestsGuardian: true
      });
    expect(otherGrant.status).toBe(201);
    const crossFamily = await request(app.getHttpServer())
      .post("/v1/children")
      .set("Authorization", otherAuthorization)
      .send(child);
    expect(crossFamily.status).toBe(404);
    const otherList = await request(app.getHttpServer())
      .get("/v1/children")
      .set("Authorization", otherAuthorization);
    expect(otherList.body).toEqual([]);

    const revoke = await request(app.getHttpServer())
      .post("/v1/consents")
      .set("Authorization", authorization)
      .send({
        scope: "child_profile",
        documentVersion: "test-v1",
        action: "revoke",
        attestsGuardian: true
      });
    expect(revoke.status).toBe(201);
    expect(revoke.body.revokedCount).toBeGreaterThan(0);
    const afterRevoke = await request(app.getHttpServer())
      .post("/v1/children")
      .set("Authorization", authorization)
      .send(child);
    expect(afterRevoke.status).toBe(403);
  });
});
