import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { openKidEduDatabase } from "./database";
import { SQLiteKidEduRepository } from "./repository";
import type { KidEduRepository } from "./types";

const KidEduRepositoryContext = createContext<KidEduRepository | null>(null);

export function KidEduDataProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<KidEduRepository | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      try {
        const db = await openKidEduDatabase();
        if (isMounted) {
          setRepository(new SQLiteKidEduRepository(db));
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Không mở được dữ liệu local.");
        }
      }
    }

    void initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => repository, [repository]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Không mở được dữ liệu</Text>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#116B65" />
        <Text style={styles.message}>Đang chuẩn bị nội dung học</Text>
      </View>
    );
  }

  return <KidEduRepositoryContext.Provider value={value}>{children}</KidEduRepositoryContext.Provider>;
}

export function useKidEduRepository(): KidEduRepository {
  const repository = useContext(KidEduRepositoryContext);

  if (!repository) {
    throw new Error("useKidEduRepository must be used inside KidEduDataProvider");
  }

  return repository;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    backgroundColor: "#F7FBFA",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: "#163B3A",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center"
  },
  message: {
    color: "#42615F",
    fontSize: 16,
    textAlign: "center"
  }
});
