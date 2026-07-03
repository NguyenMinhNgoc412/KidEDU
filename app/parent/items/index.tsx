import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Badge } from "@/components/Badge";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import {
  useArchiveLearningItemMutation,
  useCategoriesQuery,
  useCreateLearningItemMutation,
  useLearningItemsQuery
} from "@/data/queries";
import type { Category, LearningItem } from "@/data/types";
import { getContentStatusLabel } from "@/features/media/mediaResolver";
import { colors } from "@/theme";

export default function ParentItemsScreen() {
  const router = useRouter();
  const categoriesQuery = useCategoriesQuery();
  const itemsQuery = useLearningItemsQuery();
  const createMutation = useCreateLearningItemMutation();
  const archiveMutation = useArchiveLearningItemMutation();
  const categories = categoriesQuery.data ?? [];
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  function createItem() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !categoryId) {
      return;
    }

    createMutation.mutate(
      { title: trimmedTitle, categoryId },
      {
        onSuccess: () => {
          setTitle("");
        }
      }
    );
  }

  function confirmArchive(item: LearningItem) {
    Alert.alert("Xóa thẻ học", `Xóa thẻ "${item.title}" khỏi danh sách học?`, [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => archiveMutation.mutate(item.id) }
    ]);
  }

  return (
    <Screen>
      <SectionHeader title="Thẻ học" action={<KidButton label="Xong" onPress={() => router.back()} variant="plain" />} />

      <View style={styles.form}>
        <Text style={styles.formTitle}>Tạo thẻ mới</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Từ hoặc cụm từ"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <CategoryChooser categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        <KidButton
          disabled={!title.trim() || !categoryId || createMutation.isPending}
          icon={<Plus color="#FFFFFF" size={22} />}
          label="Thêm thẻ"
          onPress={createItem}
        />
      </View>

      {itemsQuery.isLoading ? <StateMessage title="Đang tải thẻ" /> : null}
      {!itemsQuery.isLoading && (itemsQuery.data ?? []).length === 0 ? <StateMessage title="Chưa có thẻ học" /> : null}
      <FlashList
        data={itemsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow item={item} onArchive={() => confirmArchive(item)} onEdit={() => router.push(`/parent/items/${item.id}`)} />
        )}
        scrollEnabled={false}
      />
    </Screen>
  );
}

function CategoryChooser({
  categories,
  selectedId,
  onSelect
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.choiceWrap}>
      {categories.map((category) => (
        <KidButton
          key={category.id}
          label={category.name}
          onPress={() => onSelect(category.id)}
          variant={selectedId === category.id ? "primary" : "plain"}
        />
      ))}
    </View>
  );
}

function ItemRow({ item, onEdit, onArchive }: { item: LearningItem; onEdit: () => void; onArchive: () => void }) {
  const label = getContentStatusLabel(item);

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>
          {item.categoryName} · {item.status === "hidden" ? "Tạm ẩn" : "Đang hiển thị"}
        </Text>
        <Badge label={label} tone={label === "Cần bổ sung" ? "warn" : label === "Đã cá nhân hóa" ? "info" : "good"} />
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
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
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
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
