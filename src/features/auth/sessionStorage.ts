import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const LOCAL_SESSION_KEY = "kidedu.local.auth.v1";

export async function readLocalSession(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  return SecureStore.getItemAsync(LOCAL_SESSION_KEY);
}

export async function writeLocalSession(value: string | null): Promise<void> {
  if (Platform.OS === "web") return;
  if (value === null) await SecureStore.deleteItemAsync(LOCAL_SESSION_KEY);
  else await SecureStore.setItemAsync(LOCAL_SESSION_KEY, value);
}

export const supabaseSessionStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key)
};
