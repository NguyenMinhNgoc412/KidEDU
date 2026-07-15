import { useFocusEffect, useRouter } from "expo-router";
import {
  BookOpen,
  LockKeyhole,
  PawPrint,
  PersonStanding,
  Play,
  Sparkles,
  Utensils,
  UsersRound
} from "lucide-react-native";
import { useCallback, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card, PressableCard } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useCategoriesQuery, useDecksQuery, useLearningItemsQuery } from "@/data/queries";
import type { Category, Deck } from "@/data/types";
import {
  categoryTileColors,
  colors,
  spacing
} from "@/theme";

export default function ChildHomeScreen() {
  const router = useRouter();
  const categoriesQuery = useCategoriesQuery();
  const decksQuery = useDecksQuery({ childOnly: true });
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const refetchDecks = decksQuery.refetch;
  const refetchItems = itemsQuery.refetch;
  const categories = categoriesQuery.data ?? [];
  const decks = decksQuery.data ?? [];
  const items = itemsQuery.data ?? [];

  useFocusEffect(
    useCallback(() => {
      void refetchDecks();
      void refetchItems();
    }, [refetchDecks, refetchItems])
  );

  return (
    <Screen>
      <View style={styles.childHero}>
        <AppText align="center" variant="sectionTitle">
          Bé chọn gì nào?
        </AppText>
        {categoriesQuery.isLoading || itemsQuery.isLoading ? (
          <StateMessage title="Đang tải nhóm học" />
        ) : null}
        {!categoriesQuery.isLoading && categories.length === 0 ? (
          <StateMessage
            title="Chưa có nhóm học"
            message="Phụ huynh có thể tạo thẻ trong các nhóm mẫu."
          />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((category, index) => (
              <CategoryTile
                key={category.id}
                category={category}
                count={items.filter((item) => item.categoryId === category.id).length}
                icon={getCategoryIcon(category.name)}
                tone={
                  categoryTileColors[index % categoryTileColors.length] ?? categoryTileColors[0]
                }
                onPress={() => router.push(`/category/${category.id}`)}
              />
            ))}
          </View>
        )}
        <KidButton
          icon={<LockKeyhole color={colors.primary} size={20} />}
          label="Khu vực Phụ huynh"
          onPress={() => router.push("/parent-gate")}
          variant="plain"
        />
      </View>

      <SectionHeader title="Bộ tự chạy" />
      {decksQuery.isLoading ? <StateMessage title="Đang tải bộ học" /> : null}
      {!decksQuery.isLoading && decks.length === 0 ? (
        <StateMessage title="Chưa có bộ học" message="Vào khu phụ huynh để tạo bộ đầu tiên." />
      ) : (
        <View style={styles.deckList}>
          {decks.map((deck) => (
            <DeckRow key={deck.id} deck={deck} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CategoryTile({
  category,
  count,
  icon,
  tone,
  onPress
}: {
  category: Category;
  count: number;
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
      <AppText align="center" numberOfLines={2} style={styles.categoryTitle} variant="bodyStrong">
        {category.name}
      </AppText>
      <AppText align="center" color="muted" variant="caption">
        {count} từ
      </AppText>
    </PressableCard>
  );
}

function DeckRow({ deck }: { deck: Deck }) {
  const router = useRouter();
  const canStart = deck.itemCount > 0;

  return (
    <Card style={styles.deckRow} variant="surface">
      <View style={styles.deckText}>
        <AppText variant="deckTitle">{deck.title}</AppText>
        <AppText color="muted" variant="label">
          {deck.itemCount} thẻ
        </AppText>
      </View>
      <KidButton
        disabled={!canStart}
        icon={<Play color={colors.onPrimary} size={22} />}
        label="Bắt đầu"
        onPress={() => router.push(`/autoplay/${deck.id}`)}
        variant="secondary"
      />
    </Card>
  );
}

function getCategoryIcon(name: string) {
  const normalized = name.toLocaleLowerCase("vi-VN");
  const iconProps = { color: colors.text, size: 34, strokeWidth: 2.4 };

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
  childHero: {
    alignItems: "center",
    gap: spacing[20],
    justifyContent: "flex-start",
    paddingTop: spacing[8]
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[16],
    justifyContent: "center",
    width: "100%"
  },
  categoryTile: {
    alignItems: "center",
    gap: spacing[8],
    justifyContent: "center",
    minHeight: 128,
    padding: spacing[14],
    shadowColor: colors.sage,
    shadowOffset: { height: spacing[8], width: spacing.none },
    shadowOpacity: 0.1,
    shadowRadius: spacing[18],
    width: "44%"
  },
  categoryIcon: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 48
  },
  categoryTitle: {
    minHeight: 44
  },
  deckList: {
    gap: spacing[12]
  },
  deckRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between",
    padding: spacing[14]
  },
  deckText: {
    flex: 1,
    gap: spacing[5]
  },
});
