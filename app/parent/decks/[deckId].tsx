import { useLocalSearchParams, useRouter } from "expo-router";
import { Save, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import {
  useArchiveDeckMutation,
  useDeckDetailQuery,
  useLearningItemsQuery,
  useUpdateDeckMutation
} from "@/data/queries";
import type { EntityStatus } from "@/data/types";
import { DeckItemChooser } from "@/features/deck/DeckItemChooser";
import { colors } from "@/theme";

export default function ParentDeckDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = params.deckId;
  const deckQuery = useDeckDetailQuery(deckId);
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const updateMutation = useUpdateDeckMutation(deckId);
  const archiveMutation = useArchiveDeckMutation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EntityStatus>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (deckQuery.data) {
      setTitle(deckQuery.data.title);
      setDescription(deckQuery.data.description ?? "");
      setStatus(deckQuery.data.status);
      setSelectedIds(deckQuery.data.items.map((item) => item.id));
    }
  }, [deckQuery.data]);

  function toggleItem(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((selectedId) => selectedId !== itemId) : [...current, itemId]
    );
  }

  function moveItem(itemId: string, direction: "up" | "down") {
    setSelectedIds((current) => {
      const index = current.indexOf(itemId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const currentValue = next[index];
      const targetValue = next[targetIndex];

      if (!currentValue || !targetValue) {
        return current;
      }

      next[index] = targetValue;
      next[targetIndex] = currentValue;
      return next;
    });
  }

  function save() {
    if (!title.trim() || selectedIds.length === 0) {
      return;
    }

    updateMutation.mutate(
      {
        title,
        description,
        status,
        itemIds: selectedIds
      },
      {
        onSuccess: () => router.back()
      }
    );
  }

  function confirmArchive() {
    Alert.alert("Xóa bộ học", "Chỉ xóa bộ học, không xóa thẻ gốc.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          archiveMutation.mutate(deckId, {
            onSuccess: () => router.replace("/parent/decks")
          })
      }
    ]);
  }

  if (deckQuery.isLoading) {
    return (
      <Screen>
        <StateMessage title="Đang tải bộ học" />
      </Screen>
    );
  }

  if (!deckQuery.data) {
    return (
      <Screen>
        <StateMessage title="Không tìm thấy bộ học" />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader title="Sửa bộ" action={<KidButton label="Quay lại" onPress={() => router.back()} variant="plain" />} />
      <View style={styles.form}>
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

        <Text style={styles.label}>Hiển thị</Text>
        <View style={styles.choiceWrap}>
          <KidButton label="Đang hiển thị" onPress={() => setStatus("active")} variant={status === "active" ? "primary" : "plain"} />
          <KidButton label="Tạm ẩn" onPress={() => setStatus("hidden")} variant={status === "hidden" ? "primary" : "plain"} />
        </View>

        <Text style={styles.label}>Thẻ trong bộ</Text>
        <DeckItemChooser items={itemsQuery.data ?? []} selectedIds={selectedIds} onMove={moveItem} onToggle={toggleItem} />

        <View style={styles.actions}>
          <KidButton
            disabled={!title.trim() || selectedIds.length === 0 || updateMutation.isPending}
            icon={<Save color="#FFFFFF" size={22} />}
            label="Lưu"
            onPress={save}
          />
          <KidButton icon={<Trash2 color="#FFFFFF" size={22} />} label="Xóa" onPress={confirmArchive} variant="danger" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 12
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actions: {
    flexDirection: "row",
    gap: 10
  }
});
