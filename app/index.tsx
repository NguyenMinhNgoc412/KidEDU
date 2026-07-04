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
import { Pressable, StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useCategoriesQuery, useDecksQuery, useLearningItemsQuery } from "@/data/queries";
import type { Category, Deck } from "@/data/types";
import { colors, radii } from "@/theme";

const tileColors = ["#FFD2A8", "#DDE7C8", "#EEF0D8", "#FFDABC", "#E6E3D2"];

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
        <Text style={styles.title}>Bé chọn gì nào?</Text>
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
                tone={tileColors[index % tileColors.length] ?? "#FFD2A8"}
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
    <Pressable
      accessibilityLabel={`Mở nhóm ${category.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryTile,
        { backgroundColor: tone },
        pressed ? styles.pressed : null
      ]}
    >
      <View style={styles.categoryIcon}>{icon}</View>
      <Text style={styles.categoryTitle} numberOfLines={2}>
        {category.name}
      </Text>
      <Text style={styles.categoryMeta}>{count} từ</Text>
    </Pressable>
  );
}

function DeckRow({ deck }: { deck: Deck }) {
  const router = useRouter();
  const canStart = deck.itemCount > 0;

  return (
    <View style={styles.deckRow}>
      <View style={styles.deckText}>
        <Text style={styles.deckTitle}>{deck.title}</Text>
        <Text style={styles.deckMeta}>{deck.itemCount} thẻ</Text>
      </View>
      <KidButton
        disabled={!canStart}
        icon={<Play color="#FFFFFF" size={22} />}
        label="Bắt đầu"
        onPress={() => router.push(`/autoplay/${deck.id}`)}
        variant="secondary"
      />
    </View>
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
    gap: 20,
    justifyContent: "flex-start",
    paddingTop: 8
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center"
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    width: "100%"
  },
  categoryTile: {
    alignItems: "center",
    borderColor: "rgba(80, 97, 63, 0.12)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 128,
    padding: 14,
    shadowColor: colors.sage,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    width: "44%"
  },
  categoryIcon: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 48
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    textAlign: "center"
  },
  categoryMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }]
  },
  deckList: {
    gap: 12
  },
  deckRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  deckText: {
    flex: 1,
    gap: 5
  },
  deckTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25
  },
  deckMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800"
  }
});
