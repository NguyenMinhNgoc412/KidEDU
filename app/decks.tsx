import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Play } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useDecksQuery } from "@/data/queries";
import type { Deck } from "@/data/types";
import { colors, radii, spacing } from "@/theme";

export default function ChildDecksScreen() {
  const router = useRouter();
  const decksQuery = useDecksQuery({ childOnly: true });
  const refetchDecks = decksQuery.refetch;
  const decks = decksQuery.data ?? [];

  useFocusEffect(
    useCallback(() => {
      void refetchDecks();
    }, [refetchDecks])
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.secondary} size={22} />
        </Pressable>
        <AppText style={styles.title} variant="deckTitle">
          Học tự động
        </AppText>
      </View>

      {decksQuery.isLoading ? <StateMessage title="Đang tải bộ học" /> : null}
      {!decksQuery.isLoading && decks.length === 0 ? (
        <StateMessage title="Chưa có bộ học" message="Phụ huynh có thể tạo bộ trong khu quản lý." />
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
        size="lg"
        variant="secondary"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    minHeight: 44
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.full,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    elevation: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  title: {
    flex: 1
  },
  deckList: {
    gap: spacing[16]
  },
  deckRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between",
    minHeight: 104,
    padding: spacing[16]
  },
  deckText: {
    flex: 1,
    gap: spacing[5]
  }
});
