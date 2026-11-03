import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";

import { createLocalApiClient } from "@/api/localClient";
import { useAuth } from "@/features/auth/AuthProvider";

import { subscriptionAllowsLearning } from "./subscriptionAllowsLearning";
import { scheduleAccessExpiry } from "./scheduleAccessExpiry";

type LearningAccess = { status: "checking" | "allowed" | "locked" | "error"; refresh(): void };
const Context = createContext<LearningAccess | null>(null);

export function LearningAccessProvider({ children }: { children: ReactNode }) {
  const { session, accessTokenValid, refreshSession } = useAuth();
  const key = session && accessTokenValid ? `${session.accountId}:${session.accessToken}` : null;
  const [result, setResult] = useState<{ key: string | null; status: LearningAccess["status"] }>({
    key: null,
    status: "locked"
  });
  const [retry, setRetry] = useState(0);
  const requestKey = key ? `${key}:${retry}` : null;
  const status =
    session && !accessTokenValid ? "error" : result.key === requestKey ? result.status : "checking";

  useEffect(() => {
    if (!session || !accessTokenValid) {
      setResult({ key: null, status: "locked" });
      return;
    }
    let active = true;
    let cancelExpiry: (() => void) | undefined;
    setResult({ key: requestKey, status: "checking" });
    const client = createLocalApiClient(
      process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
      session.accessToken
    );
    const startedAt = performance.now();
    void client.getSubscription().then(
      (subscription) => {
        if (!active) return;
        const expiry = subscription.accessUntil ? Date.parse(subscription.accessUntil) : 0;
        const serverTime = Date.parse(subscription.serverTime);
        // Until signed activation/key delivery exists, this projection is a dev-only guard.
        const allowed = __DEV__ && subscriptionAllowsLearning(subscription);
        setResult({ key: requestKey, status: allowed ? "allowed" : "locked" });
        if (allowed) {
          cancelExpiry = scheduleAccessExpiry(
            expiry - serverTime - (performance.now() - startedAt),
            () => {
              if (active) setResult({ key: requestKey, status: "locked" });
            }
          );
        }
      },
      () => {
        if (active) setResult({ key: requestKey, status: "error" });
      }
    );
    return () => {
      active = false;
      cancelExpiry?.();
    };
  }, [requestKey]);

  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") setRetry((value) => value + 1);
    });
    return () => listener.remove();
  }, []);

  return (
    <Context.Provider
      value={{
        status,
        refresh: () => {
          void refreshSession().then(() => setRetry((value) => value + 1));
        }
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useLearningAccess(): LearningAccess {
  const value = useContext(Context);
  if (!value) throw new Error("useLearningAccess must be inside LearningAccessProvider");
  return value;
}
