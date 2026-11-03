import { useFocusEffect, useRouter } from "expo-router";
import {
  BookOpen,
  Clapperboard,
  LockKeyhole,
  PawPrint,
  PersonStanding,
  Sparkles,
  Utensils,
  UsersRound
} from "lucide-react-native";
import { useCallback, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { PressableCard } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useCategoriesQuery, useDecksQuery } from "@/data/queries";
import { useLearningAccess } from "@/features/entitlement/LearningAccessProvider";
import { TodayPlanCard } from "@/features/learning/TodayPlanCard";
import type { Category } from "@/data/types";
import { categoryTileColors, categoryTileForegroundColors, colors, radii, spacing } from "@/theme";

export default function ChildHomeScreen() {
  const { status, refresh } = useLearningAccess();
  const router = useRouter();

  return (
    <Screen
      bottomBar={
        <MobileTabBar
          items={[
            {
              active: true,
              icon: <BookOpen color={colors.secondary} size={21} strokeWidth={2.3} />,
              label: "Học",
              onPress: () => undefined
            },
            {
              icon: <UsersRound color={colors.muted} size={21} strokeWidth={2.3} />,
              label: "Phụ huynh",
              onPress: () => router.push("/parent-gate")
            }
          ]}
        />
      }
      scroll={false}
    >
      <View style={styles.brandBar}>
        <View style={styles.brandMark}>
          <Sparkles color={colors.primary} size={18} strokeWidth={2.5} />
        </View>
        <AppText color="primary" variant="bodyStrong">
          KidEDU
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.childHero}
        showsVerticalScrollIndicator={false}
        style={styles.mainScroll}
      >
        <View style={styles.intro}>
          <AppText variant="screenTitle">Hôm nay mình học gì?</AppText>
          <AppText color="muted">Cùng người lớn luyện nói qua những điều gần gũi mỗi ngày.</AppText>
        </View>
        {status === "allowed" ? (
          <>
            <TodayPlanCard />
            {__DEV__ ? <LegacyLearningChoices /> : null}
          </>
        ) : (
          <>
            <View style={styles.todayCard}>
              <View style={styles.todayIcon}>
                <LockKeyhole color={colors.primary} size={26} />
              </View>
              <AppText color="primary" variant="labelStrong">
                BÀI HÔM NAY
              </AppText>
              <AppText variant="cardTitle">
                {status === "checking" ? "Đang kiểm tra quyền học" : "Nội dung học đang khóa"}
              </AppText>
              <AppText color="muted">
                {status === "error"
                  ? "Chưa kết nối được với máy chủ. Nhờ phụ huynh kiểm tra mạng."
                  : "Nhờ phụ huynh xem gói học và chuẩn bị bài cho con. Dữ liệu gia đình vẫn xem được."}
              </AppText>
              <KidButton
                fullWidth
                label={status === "error" ? "Thử kết nối lại" : "Nhờ phụ huynh mở"}
                onPress={status === "error" ? refresh : () => router.push("/parent-gate")}
                size="lg"
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function LegacyLearningChoices() {
  const router = useRouter();
  const categoriesQuery = useCategoriesQuery();
  const decksQuery = useDecksQuery({ childOnly: true });
  const refetchDecks = decksQuery.refetch;
  const categories = categoriesQuery.data ?? [];
  const decks = decksQuery.data ?? [];

  useFocusEffect(
    useCallback(() => {
      void refetchDecks();
    }, [refetchDecks])
  );

  return (
    <>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitle}>
          <AppText variant="cardTitle">Luyện thêm</AppText>
          <AppText color="muted" variant="label">
            Nội dung có sẵn trên thiết bị
          </AppText>
        </View>
      </View>
      {categoriesQuery.isLoading ? <StateMessage title="Đang tải nội dung" /> : null}
      {!categoriesQuery.isLoading && categories.length === 0 ? (
        <StateMessage title="Chưa có nội dung luyện thêm" />
      ) : (
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <CategoryTile
              key={category.id}
              category={category}
              foreground={
                categoryTileForegroundColors[index % categoryTileForegroundColors.length] ??
                categoryTileForegroundColors[0]
              }
              icon={getCategoryIcon(
                category.name,
                categoryTileForegroundColors[index % categoryTileForegroundColors.length] ??
                  categoryTileForegroundColors[0]
              )}
              tone={categoryTileColors[index % categoryTileColors.length] ?? categoryTileColors[0]}
              onPress={() => router.push(`/category/${category.id}`)}
            />
          ))}
        </View>
      )}
      {decks.length > 0 ? (
        <KidButton
          fullWidth
          icon={<Clapperboard color={colors.onPrimary} size={22} />}
          label="Xem bộ luyện thêm"
          onPress={() => router.push("/decks")}
          size="lg"
          variant="secondary"
        />
      ) : null}
    </>
  );
}

function CategoryTile({
  category,
  foreground,
  icon,
  tone,
  onPress
}: {
  category: Category;
  foreground: string;
  icon: ReactNode;
  tone: string;
  onPress: () => void;
}) {
  return (
    <PressableCard
      accessibilityLabel={`Mở nhóm ${category.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.categoryTile, { backgroundColor: tone }]}
    >
      <View style={styles.categoryIcon}>{icon}</View>
      <AppText
        align="center"
        numberOfLines={2}
        style={[styles.categoryTitle, { color: foreground }]}
        variant="bodyStrong"
      >
        {category.name}
      </AppText>
    </PressableCard>
  );
}

function getCategoryIcon(name: string, color: string) {
  const normalized = name.toLocaleLowerCase("vi-VN");
  const iconProps = { color, size: 36, strokeWidth: 2.6 };

  if (normalized.includes("gia")) {
    return <UsersRound {...iconProps} />;
  }

  if (normalized.includes("nhu") || normalized.includes("ăn") || normalized.includes("uống")) {
    return <Utensils {...iconProps} />;
  }

  if (normalized.includes("đồ")) {
    return <BookOpen {...iconProps} />;
  }

  if (normalized.includes("vật") || normalized.includes("mèo") || normalized.includes("chó")) {
    return <PawPrint {...iconProps} />;
  }

  if (normalized.includes("hành") || normalized.includes("động")) {
    return <PersonStanding {...iconProps} />;
  }

  return <Sparkles {...iconProps} />;
}

const styles = StyleSheet.create({
  brandBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8],
    minHeight: 38
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  childHero: {
    alignItems: "stretch",
    flexGrow: 1,
    gap: spacing[14],
    justifyContent: "flex-start",
    paddingTop: spacing[4]
  },
  mainScroll: {
    flex: 1
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing[12],
    width: "100%"
  },
  categoryTile: {
    alignItems: "center",
    gap: spacing[8],
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 2,
    minHeight: 120,
    padding: spacing[12],
    width: "48%"
  },
  categoryIcon: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    width: 52
  },
  categoryTitle: {
    minHeight: 22
  },
  intro: {
    alignItems: "flex-start",
    gap: spacing[6],
    width: "100%"
  },
  todayCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing[8],
    padding: spacing[20],
    width: "100%"
  },
  todayIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  sectionTitle: {
    flex: 1,
    gap: spacing[4]
  }
});
