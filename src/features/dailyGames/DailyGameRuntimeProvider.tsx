import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SQLite from "expo-sqlite";
import { z } from "zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { DailyGameLocalRepository } from "./localRepository";
import { DailyGameAccountRuntime } from "./accountRuntime";

type Namespace = { accountId: string; runtime: DailyGameAccountRuntime | null; error: boolean };
const Context = createContext<{
  repository: DailyGameLocalRepository | null;
  runtime: DailyGameAccountRuntime | null;
  error: boolean;
}>({
  repository: null,
  runtime: null,
  error: false
});

/** Reference/checkpoint storage only; opening SQLite grants no content or game access. */
export function DailyGameRuntimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const accountId = session?.accountId;
  const [namespace, setNamespace] = useState<Namespace | null>(null);
  useEffect(() => {
    if (!accountId) return;
    let active = true;
    let database: SQLite.SQLiteDatabase | undefined;
    let repository: DailyGameLocalRepository | undefined;
    let runtime: DailyGameAccountRuntime | undefined;
    let closing: Promise<void> | undefined;
    const close = () => {
      if (!closing)
        closing = (async () => {
          try {
            if (runtime) await runtime.close();
            else await repository?.close();
          } finally {
            await database?.closeAsync();
          }
        })();
      return closing;
    };
    const ready = (async () => {
      if (!z.uuid().safeParse(accountId).success) throw new Error("INVALID_ACCOUNT_NAMESPACE");
      database = await SQLite.openDatabaseAsync(`daily-games-${accountId.toLowerCase()}.db`);
      await database.execAsync("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
      repository = new DailyGameLocalRepository(database, accountId);
      runtime = new DailyGameAccountRuntime(repository);
      await repository.initialize();
      if (active) setNamespace({ accountId, runtime, error: false });
    })();
    void ready
      .catch(async () => {
        if (active) setNamespace({ accountId, runtime: null, error: true });
        await close();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      // Invalidate available handles synchronously, including queued operations.
      if (runtime) void runtime.close().catch(() => undefined);
      else void repository?.close().catch(() => undefined);
      void ready
        .catch(() => undefined)
        .then(close)
        .catch(() => undefined);
    };
  }, [accountId]);
  const current = namespace?.accountId === accountId ? namespace : null;
  return (
    <Context.Provider
      value={{
        repository: current?.runtime?.repository ?? null,
        runtime: current?.runtime ?? null,
        error: current?.error ?? false
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDailyGameRepository = () => useContext(Context);
