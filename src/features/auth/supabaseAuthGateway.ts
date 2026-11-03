import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { createLocalApiClient } from "@/api/localClient";

import type { AuthGateway, AuthSession } from "./authGateway";
import { supabaseSessionStorage } from "./sessionStorage";

export class SupabaseAuthGateway implements AuthGateway {
  private readonly client: SupabaseClient;
  private accountId: string | null = null;

  constructor(
    url: string,
    publishableKey: string,
    private readonly apiUrl: string
  ) {
    if (new URL(url).protocol !== "https:") throw new Error("SUPABASE_URL_REQUIRES_HTTPS");
    this.client = createClient(url, publishableKey, {
      auth: {
        ...(Platform.OS === "web" ? {} : { storage: supabaseSessionStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
  }

  private mapSession(
    session: { access_token: string; expires_at?: number } | null
  ): AuthSession | null {
    return session && this.accountId
      ? {
          accountId: this.accountId,
          accessToken: session.access_token,
          expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString()
        }
      : null;
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error("INVALID_CREDENTIALS");
    try {
      const me = await createLocalApiClient(this.apiUrl, data.session.access_token).getMe();
      this.accountId = me.id;
    } catch {
      await this.client.auth.signOut();
      throw new Error("APP_SERVER_REJECTED_SESSION");
    }
    const session = this.mapSession(data.session);
    if (!session) throw new Error("LOGIN_UNAVAILABLE");
    return session;
  }

  async restore(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) return null;
    const me = await createLocalApiClient(this.apiUrl, data.session.access_token).getMe();
    this.accountId = me.id;
    return this.mapSession(data.session);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut({ scope: "local" });
    this.accountId = null;
  }

  async refresh(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.refreshSession();
    if (error) {
      if (
        ["refresh_token_not_found", "refresh_token_already_used", "session_not_found"].includes(
          error.code ?? ""
        )
      ) {
        return null;
      }
      throw new Error("AUTH_REFRESH_UNAVAILABLE");
    }
    if (!data.session) return null;
    const me = await createLocalApiClient(this.apiUrl, data.session.access_token).getMe();
    this.accountId = me.id;
    return this.mapSession(data.session);
  }

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    const reconcileAutoRefresh = () => {
      if (AppState.currentState === "active") void this.client.auth.startAutoRefresh();
      else void this.client.auth.stopAutoRefresh();
    };
    const appStateListener =
      Platform.OS !== "web" ? AppState.addEventListener("change", reconcileAutoRefresh) : null;
    if (Platform.OS !== "web") reconcileAutoRefresh();
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") this.accountId = null;
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") listener(this.mapSession(session));
    });
    return () => {
      appStateListener?.remove();
      if (Platform.OS !== "web") void this.client.auth.stopAutoRefresh();
      data.subscription.unsubscribe();
    };
  }
}
