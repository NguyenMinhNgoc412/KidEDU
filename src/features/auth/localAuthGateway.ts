import { createLocalApiClient } from "@/api/localClient";
import { requestWithTimeout } from "@/api/requestWithTimeout";

import type { AuthGateway, AuthSession } from "./authGateway";
import { readLocalSession, writeLocalSession } from "./sessionStorage";

export class LocalAuthGateway implements AuthGateway {
  constructor(
    private readonly apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
    private readonly identityUrl = process.env.EXPO_PUBLIC_LOCAL_IDENTITY_URL ??
      "http://localhost:3011"
  ) {}

  async signIn(email: string, password: string): Promise<AuthSession> {
    const credentials = await requestWithTimeout(async (signal) => {
      const response = await fetch(`${this.identityUrl.replace(/\/+$/, "")}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal
      });
      if (response.status === 401) throw new Error("INVALID_CREDENTIALS");
      if (!response.ok) throw new Error("LOGIN_UNAVAILABLE");
      return (await response.json()) as Pick<AuthSession, "accessToken" | "expiresAt">;
    });
    const me = await createLocalApiClient(this.apiUrl, credentials.accessToken).getMe();
    const session = { ...credentials, accountId: me.id };
    await writeLocalSession(JSON.stringify(session));
    return session;
  }

  async restore(): Promise<AuthSession | null> {
    const stored = await readLocalSession();
    if (!stored) return null;
    try {
      const session = JSON.parse(stored) as AuthSession;
      if (!session.accessToken || Date.parse(session.expiresAt) <= Date.now()) {
        await this.signOut();
        return null;
      }
      const me = await createLocalApiClient(this.apiUrl, session.accessToken).getMe();
      return { ...session, accountId: me.id };
    } catch {
      await this.signOut();
      return null;
    }
  }

  async signOut(): Promise<void> {
    await writeLocalSession(null);
  }

  async refresh(): Promise<AuthSession | null> {
    // Synthetic identity has no refresh credential; never invent a longer expiry.
    return this.restore();
  }

  subscribe(): () => void {
    return () => undefined;
  }
}
