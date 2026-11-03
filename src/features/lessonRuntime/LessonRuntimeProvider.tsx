import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";

import { useAuth } from "@/features/auth/AuthProvider";
import { LessonRuntimeRepository } from "./runtimeRepository";
import { localFixtureEnabled } from "./fixtureBoundary";

const Context = createContext<{ repository: LessonRuntimeRepository | null; error: boolean }>({
  repository: null,
  error: false
});

export function LessonRuntimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const accountId = session?.accountId;
  const [value, setValue] = useState<{
    accountId: string;
    repository: LessonRuntimeRepository;
  } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let repository: LessonRuntimeRepository | undefined;
    let database: SQLite.SQLiteDatabase | undefined;
    setError(false);
    if (!accountId || !localFixtureEnabled()) return;
    const ready = (async () => {
      if (!/^[0-9a-f-]{36}$/i.test(accountId)) throw new Error("INVALID_ACCOUNT_NAMESPACE");
      database = await SQLite.openDatabaseAsync(`lesson-runtime-${accountId.toLowerCase()}.db`);
      await database.execAsync("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
      repository = new LessonRuntimeRepository(database, accountId);
      await repository.initialize();
      if (active) setValue({ accountId, repository });
    })();
    void ready.catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
      // Reject old handles immediately; drain committed work before closing SQLite.
      void repository?.close();
      void ready
        .catch(() => undefined)
        .then(async () => {
          await repository?.close();
          await database?.closeAsync();
        })
        .catch(() => undefined);
    };
  }, [accountId]);
  return (
    <Context.Provider
      value={{
        repository: value && value.accountId === accountId ? value.repository : null,
        error
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLessonRuntimeRepository() {
  return useContext(Context);
}
