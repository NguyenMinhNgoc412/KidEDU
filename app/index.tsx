import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { LockKeyhole, Play, Volume2 } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/Badge";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useDecksQuery, useLearningItemsQuery } from "@/data/queries";
import type { Deck, LearningItem } from "@/data/types";
import { getContentStatusLabel } from "@/features/media/mediaResolver";
import { colors } from "@/theme";

export default function ChildHomeScreen() {
  const router = useRouter();
  const decksQuery = useDecksQuery({ childOnly: true });
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const refetchDecks = decksQuery.refetch;
  const refetchItems = itemsQuery.refetch;
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
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.kicker}>KidEDU</Text>
          <Text style={styles.title}>Hôm nay mình học nhé</Text>
        </View>
        <KidButton
          icon={<LockKeyhole color="#FFFFFF" size={22} />}
          label="Phụ huynh"
          onPress={() => router.push("/parent-gate")}
          variant="secondary"
        />
      </View>

      <SectionHeader title="Bộ học" />
      {decksQuery.isLoading ? <StateMessage title="Đang tải bộ học" /> : null}
      {!decksQuery.isLoading && decks.length === 0 ? (
        <StateMessage title="Chưa có bộ học" message="Vào khu phụ huynh để tạo bộ đầu tiên." />
      ) : (
        <FlashList
          data={decks}
          keyExtractor={(deck) => deck.id}
          renderItem={({ item }) => <DeckRow deck={item} />}
          scrollEnabled={false}
        />
      )}

      <SectionHeader title="Thẻ học" />
      {itemsQuery.isLoading ? <StateMessage title="Đang tải thẻ học" /> : null}
      {!itemsQuery.isLoading && items.length === 0 ? (
        <StateMessage title="Chưa có thẻ học" message="Phụ huynh có thể tạo thẻ mới trong khu quản lý." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LearningItemRow item={item} />}
          scrollEnabled={false}
        />
      )}
    </Screen>
  );
}

function DeckRow({ deck }: { deck: Deck }) {
  const router = useRouter();
  const canStart = deck.itemCount > 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{deck.title}</Text>
        <Text style={styles.rowMeta}>{deck.itemCount} thẻ</Text>
      </View>
      <KidButton
        disabled={!canStart}
        icon={<Play color="#FFFFFF" size={22} />}
        label="Bắt đầu"
        onPress={() => router.push(`/autoplay/${deck.id}`)}
      />
    </View>
  );
}

function LearningItemRow({ item }: { item: LearningItem }) {
  const router = useRouter();
  const label = getContentStatusLabel(item);

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>{item.categoryName}</Text>
        <Badge label={label} tone={label === "Cần bổ sung" ? "warn" : label === "Đã cá nhân hóa" ? "info" : "good"} />
      </View>
      <KidButton
        icon={<Volume2 color="#FFFFFF" size={22} />}
        label="Học"
        onPress={() => router.push(`/learning/${item.id}`)}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    padding: 16
  },
  heroText: {
    flex: 1,
    gap: 4
  },
  kicker: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 12
  },
  rowText: {
    flex: 1,
    gap: 6
  },
  rowTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  }
});
