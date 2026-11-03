import type { AuthGateway } from "./authGateway";
import { LocalAuthGateway } from "./localAuthGateway";
import { SupabaseAuthGateway } from "./supabaseAuthGateway";

export function createAuthGateway(): AuthGateway | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (url && key && apiUrl) return new SupabaseAuthGateway(url, key, apiUrl);
  if (__DEV__) return new LocalAuthGateway();
  return null;
}
