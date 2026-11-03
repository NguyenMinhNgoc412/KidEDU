import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, fontSizes, spacing } from "@/theme";

import { closeKidEduDatabase, openKidEduDatabase } from "./database";
import { SQLiteKidEduRepository } from "./repository";
import type { KidEduRepository } from "./types";

const KidEduRepositoryContext = createContext<KidEduRepository | null>(null);

export function KidEduDataProvider({
  accountId,
  children
}: {
  accountId: string;
  children: ReactNode;
}) {
  const [repository, setRepository] = useState<KidEduRepository | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      try {
        const db = await openKidEduDatabase(accountId);
        const nextRepository = new SQLiteKidEduRepository(db);

        await nextRepository.recoverActivePracticeSessions();

        if (isMounted) {
          setRepository(nextRepository);
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
      void closeKidEduDatabase(accountId);
    };
  }, [accountId]);

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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>Đang chuẩn bị nội dung học</Text>
      </View>
    );
  }

  return (
    <KidEduRepositoryContext.Provider value={value}>{children}</KidEduRepositoryContext.Provider>
  );
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
    backgroundColor: colors.loadingBackground,
    flex: 1,
    gap: spacing[12],
    justifyContent: "center",
    padding: spacing[24]
  },
  title: {
    color: colors.loadingText,
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[22],
    textAlign: "center"
  },
  message: {
    color: colors.loadingMuted,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes[16],
    textAlign: "center"
  }
});
