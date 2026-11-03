/** Synthetic observations must never reach a real Supabase/production account. */
export function permitsLocalFixture(
  development: boolean,
  apiUrl: string,
  supabaseUrl?: string,
  lanOptIn = false
) {
  if (!development || supabaseUrl) return false;
  try {
    const url = new URL(apiUrl);
    const parts = url.hostname.split(".").map(Number);
    const privateLan =
      parts.length === 4 &&
      parts.every((value) => Number.isInteger(value) && value >= 0 && value <= 255) &&
      (parts[0] === 10 ||
        (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) ||
        (parts[0] === 192 && parts[1] === 168));
    return (
      url.protocol === "http:" &&
      (["localhost", "127.0.0.1", "10.0.2.2"].includes(url.hostname) || (lanOptIn && privateLan))
    );
  } catch {
    return false;
  }
}
export function localFixtureEnabled() {
  return permitsLocalFixture(
    __DEV__,
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_ENABLE_LOCAL_LESSON_FIXTURE === "1"
  );
}
