import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { Edit3, Layers3, Plus, Search, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { colors, radii } from "@/theme";

const EMPTY_LEARNING_ITEMS: LearningItem[] = [];

export default function ParentItemsScreen() {
  const router = useRouter();
  const categoriesQuery = useCategoriesQuery();
  const itemsQuery = useLearningItemsQuery();
  const createMutation = useCreateLearningItemMutation();
  const archiveMutation = useArchiveLearningItemMutation();
  const refetchItems = itemsQuery.refetch;
  const categories = categoriesQuery.data ?? [];
  const queryItems = itemsQuery.data ?? EMPTY_LEARNING_ITEMS;
  const [instantItems, setInstantItems] = useState<LearningItem[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const titleInputRef = useRef<TextInput>(null);

  const items = useMemo(() => {
    if (instantItems.length === 0) {
      return queryItems;
    }

    const instantItemIds = new Set(instantItems.map((item) => item.id));
    return [...instantItems, ...queryItems.filter((item) => !instantItemIds.has(item.id))];
  }, [instantItems, queryItems]);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (queryItems.length === 0) {
      return;
    }

    const queryItemIds = new Set(queryItems.map((item) => item.id));
    setInstantItems((currentItems) => {
      const nextItems = currentItems.filter((item) => !queryItemIds.has(item.id));
      return nextItems.length === currentItems.length ? currentItems : nextItems;
    });
  }, [queryItems]);

  useFocusEffect(
    useCallback(() => {
      void refetchItems();
    }, [refetchItems])
  );

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");

    if (!keyword) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLocaleLowerCase("vi-VN").includes(keyword) ||
        item.categoryName.toLocaleLowerCase("vi-VN").includes(keyword)
    );
  }, [items, search]);
  const filteredItemIds = useMemo(
    () => filteredItems.map((item) => item.id).join("|"),
    [filteredItems]
  );

  const practicingCount = items.filter((item) => item.learningStatus === "practicing").length;

  function createItem() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !categoryId) {
      return;
    }

    createMutation.mutate(
      { title: trimmedTitle, categoryId },
      {
        onSuccess: async ({ item }) => {
          if (item) {
            setInstantItems((currentItems) => [
              item,
              ...currentItems.filter((currentItem) => currentItem.id !== item.id)
            ]);
          }

          setTitle("");
          setSearch("");
          await refetchItems();
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
      <View style={styles.appHeader}>
        <Text style={styles.brand}>KidEDU</Text>
        <KidButton label="Xong" onPress={() => router.back()} variant="plain" />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Quản lý từ vựng</Text>
        <Text style={styles.subtitle}>Theo dõi và tạo từ gần với con</Text>
      </View>

      <View style={styles.actionRow}>
        <KidButton
          icon={<Plus color="#FFFFFF" size={22} />}
          label="Thêm thẻ mới"
          onPress={() => titleInputRef.current?.focus()}
          variant="secondary"
        />
        <KidButton
          icon={<Layers3 color={colors.primary} size={22} />}
          label="Quản lý bộ học"
          onPress={() => router.push("/parent/decks")}
          variant="plain"
        />
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Tổng quan tiến độ</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Đã thêm</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{practicingCount}</Text>
            <Text style={styles.statLabel}>Đang luyện</Text>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Thêm thẻ nhanh</Text>
        <Text style={styles.fieldLabel}>Từ vựng</Text>
        <TextInput
          ref={titleInputRef}
          onChangeText={setTitle}
          placeholder="Nhập từ vựng..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <Text style={styles.fieldLabel}>Danh mục</Text>
        <CategoryChooser categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
        <KidButton
          disabled={!title.trim() || !categoryId || createMutation.isPending}
          icon={<Plus color="#FFFFFF" size={22} />}
          label="Lưu thẻ"
          onPress={createItem}
          variant="secondary"
        />
        <Text style={styles.formNote}>
          Sau khi lưu, mở thẻ để thêm ảnh, video khẩu hình hoặc âm phát âm cá nhân.
        </Text>
      </View>

      <SectionHeader title="Danh sách từ" />
      <View style={styles.searchBox}>
        <Search color={colors.muted} size={18} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={search}
        />
      </View>

      {itemsQuery.isLoading ? <StateMessage title="Đang tải thẻ" /> : null}
      {!itemsQuery.isLoading && items.length === 0 ? (
        <StateMessage title="Chưa có thẻ học" />
      ) : null}
      {!itemsQuery.isLoading && items.length > 0 && filteredItems.length === 0 ? (
        <StateMessage title="Không có từ phù hợp" />
      ) : null}
      <FlashList
        data={filteredItems}
        extraData={filteredItemIds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onArchive={() => confirmArchive(item)}
            onEdit={() => router.push(`/parent/items/${item.id}`)}
          />
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

function ItemRow({
  item,
  onEdit,
  onArchive
}: {
  item: LearningItem;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const label = getContentStatusLabel(item);

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMeta}>
          {item.categoryName} · {item.status === "hidden" ? "Tạm ẩn" : "Đang hiển thị"}
        </Text>
        <Badge
          label={label}
          tone={label === "Cần bổ sung" ? "warn" : label === "Đã cá nhân hóa" ? "info" : "good"}
        />
      </View>
      <View style={styles.rowActions}>
        <KidButton
          icon={<Edit3 color="#FFFFFF" size={20} />}
          label="Sửa"
          onPress={onEdit}
          variant="secondary"
        />
        <KidButton
          icon={<Trash2 color="#FFFFFF" size={20} />}
          label="Xóa"
          onPress={onArchive}
          variant="danger"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  titleBlock: {
    gap: 4
  },
  screenTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  statsTitle: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "900"
  },
  statsRow: {
    flexDirection: "row",
    gap: 12
  },
  statPill: {
    alignItems: "center",
    backgroundColor: "#FFFDF2",
    borderRadius: radii.lg,
    flex: 1,
    gap: 4,
    padding: 12
  },
  statNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
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
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  formNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFDF2",
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  row: {
    backgroundColor: colors.surfaceAlt,
    borderColor: "rgba(80, 97, 63, 0.1)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
    padding: 14
  },
  rowText: {
    gap: 6
  },
  rowTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 27
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  rowActions: {
    flexDirection: "row",
    gap: 8
  }
});
