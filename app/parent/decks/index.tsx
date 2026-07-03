import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

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
import { colors, radii } from "@/theme";

export default function ParentDecksScreen() {
  const router = useRouter();
  const decksQuery = useDecksQuery();
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const createMutation = useCreateDeckMutation();
  const archiveMutation = useArchiveDeckMutation();
  const refetchDecks = decksQuery.refetch;
  const refetchItems = itemsQuery.refetch;
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
      current.includes(itemId) ? current.filter((selectedId) => selectedId !== itemId) : [...current, itemId]
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
    <Screen>
      <SectionHeader title="Bộ học" action={<KidButton label="Xong" onPress={() => router.back()} variant="plain" />} />

      <View style={styles.form}>
        <Text style={styles.formTitle}>Tạo bộ mới</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Tên bộ học"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <TextInput
          onChangeText={setDescription}
          placeholder="Mô tả ngắn"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={description}
        />
        {itemsQuery.isLoading ? <StateMessage title="Đang tải thẻ để chọn" /> : null}
        {!itemsQuery.isLoading && (itemsQuery.data ?? []).length === 0 ? (
          <StateMessage title="Chưa có thẻ học" message="Tạo thẻ học trước rồi quay lại tạo bộ." />
        ) : (
          <DeckItemChooser items={itemsQuery.data ?? []} selectedIds={selectedIds} onToggle={toggleItem} />
        )}
        <KidButton
          disabled={!title.trim() || selectedIds.length === 0 || createMutation.isPending}
          icon={<Plus color="#FFFFFF" size={22} />}
          label="Thêm bộ"
          onPress={createDeck}
        />
      </View>

      {decksQuery.isLoading ? <StateMessage title="Đang tải bộ học" /> : null}
      {!decksQuery.isLoading && (decksQuery.data ?? []).length === 0 ? <StateMessage title="Chưa có bộ học" /> : null}
      <FlashList
        data={decksQuery.data ?? []}
        keyExtractor={(deck) => deck.id}
        renderItem={({ item }) => (
          <DeckRow deck={item} onArchive={() => confirmArchive(item)} onEdit={() => router.push(`/parent/decks/${item.id}`)} />
        )}
        scrollEnabled={false}
      />
    </Screen>
  );
}

function DeckRow({ deck, onEdit, onArchive }: { deck: Deck; onEdit: () => void; onArchive: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{deck.title}</Text>
        <Text style={styles.rowMeta}>
          {deck.itemCount} thẻ · {deck.status === "hidden" ? "Tạm ẩn" : "Đang hiển thị"}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <KidButton icon={<Edit3 color="#FFFFFF" size={20} />} label="Sửa" onPress={onEdit} variant="secondary" />
        <KidButton icon={<Trash2 color="#FFFFFF" size={20} />} label="Xóa" onPress={onArchive} variant="danger" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  input: {
    backgroundColor: "#FFFDF2",
    borderColor: colors.sage,
    borderRadius: radii.lg,
    borderWidth: 2,
    color: colors.text,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 16
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    padding: 12
  },
  rowText: {
    gap: 6
  },
  rowTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  rowActions: {
    flexDirection: "row",
    gap: 8
  }
});
