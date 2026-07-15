import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import {
  useArchiveDeckMutation,
  useCreateDeckMutation,
  useDecksQuery,
  useLearningItemsQuery
} from "@/data/queries";
import type { Deck } from "@/data/types";
import { DeckItemChooser } from "@/features/deck/DeckItemChooser";
import { colors, spacing } from "@/theme";

export default function ParentDecksScreen() {
  const router = useRouter();
  const decksQuery = useDecksQuery();
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const createMutation = useCreateDeckMutation();
  const archiveMutation = useArchiveDeckMutation();
  const refetchDecks = decksQuery.refetch;
  const refetchItems = itemsQuery.refetch;
  const decks = decksQuery.data ?? [];
  const learningItems = itemsQuery.data ?? [];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      void refetchDecks();
      void refetchItems();
    }, [refetchDecks, refetchItems])
  );

  function toggleItem(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((selectedId) => selectedId !== itemId)
        : [...current, itemId]
    );
  }

  function createDeck() {
    if (!title.trim() || selectedIds.length === 0) {
      return;
    }

    createMutation.mutate(
      {
        title,
        description,
        itemIds: selectedIds
      },
      {
        onSuccess: async () => {
          setTitle("");
          setDescription("");
          setSelectedIds([]);
          await refetchDecks();
        }
      }
    );
  }

  function confirmArchive(deck: Deck) {
    Alert.alert("Xóa bộ học", `Xóa bộ "${deck.title}"? Thẻ gốc vẫn được giữ lại.`, [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => archiveMutation.mutate(deck.id) }
    ]);
  }

  return (
    <Screen scroll={false}>
      <FlashList
        data={decks}
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={!decksQuery.isLoading ? <StateMessage title="Chưa có bộ học" /> : null}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SectionHeader
              title="Bộ học"
              action={<KidButton label="Xong" onPress={() => router.back()} variant="plain" />}
            />

            <Card padding="lg" style={styles.form} variant="form">
              <AppText variant="cardTitle">Tạo bộ mới</AppText>
              <TextField
                onChangeText={setTitle}
                placeholder="Tên bộ học"
                value={title}
              />
              <TextField
                onChangeText={setDescription}
                placeholder="Mô tả ngắn"
                value={description}
              />
              {itemsQuery.isLoading ? <StateMessage title="Đang tải thẻ để chọn" /> : null}
              {!itemsQuery.isLoading && learningItems.length === 0 ? (
                <StateMessage
                  title="Chưa có thẻ học"
                  message="Tạo thẻ học trước rồi quay lại tạo bộ."
                />
              ) : (
                <DeckItemChooser
                  items={learningItems}
                  selectedIds={selectedIds}
                  onToggle={toggleItem}
                />
              )}
              <KidButton
                disabled={!title.trim() || selectedIds.length === 0 || createMutation.isPending}
                icon={<Plus color={colors.onPrimary} size={22} />}
                label="Thêm bộ"
                onPress={createDeck}
              />
            </Card>

            {decksQuery.isLoading ? <StateMessage title="Đang tải bộ học" /> : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(deck) => deck.id}
        renderItem={({ item }) => (
          <DeckRow
            deck={item}
            onArchive={() => confirmArchive(item)}
            onEdit={() => router.push(`/parent/decks/${item.id}`)}
          />
        )}
        style={styles.list}
      />
    </Screen>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

function DeckRow({
  deck,
  onEdit,
  onArchive
}: {
  deck: Deck;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card variant="surface">
      <View style={styles.rowText}>
        <AppText variant="deckTitle">{deck.title}</AppText>
        <AppText color="muted" variant="label">
          {deck.itemCount} thẻ · {deck.status === "hidden" ? "Tạm ẩn" : "Đang hiển thị"}
        </AppText>
      </View>
      <View style={styles.rowActions}>
        <KidButton
          icon={<Edit3 color={colors.onPrimary} size={20} />}
          label="Sửa"
          onPress={onEdit}
          variant="secondary"
        />
        <KidButton
          icon={<Trash2 color={colors.onPrimary} size={20} />}
          label="Xóa"
          onPress={onArchive}
          variant="danger"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1
  },
  listContent: {
    paddingBottom: spacing[24]
  },
  listHeader: {
    gap: spacing[16],
    paddingBottom: spacing[16]
  },
  listGap: {
    height: spacing[10]
  },
  form: {
    gap: spacing[12]
  },
  rowText: {
    gap: spacing[6]
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing[8]
  }
});
