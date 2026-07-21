import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { Edit3, Layers3, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View, type TextInput } from "react-native";

import { AppText } from "@/components/AppText";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { SearchField, TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useKidEduRepository } from "@/data/KidEduDataProvider";
import {
  useArchiveLearningItemMutation,
  useCategoriesQuery,
  useCreateLearningItemMutation,
  useLearningItemsQuery
} from "@/data/queries";
import type { Category, LearningItem } from "@/data/types";
import { cleanupOrphanedMediaFiles } from "@/features/media/mediaCleanupService";
import { getContentStatusLabel } from "@/features/media/mediaResolver";
import { colors, radii, spacing } from "@/theme";

const EMPTY_LEARNING_ITEMS: LearningItem[] = [];

export default function ParentItemsScreen() {
  const router = useRouter();
  const repository = useKidEduRepository();
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
          if (item) {
            router.push(`/parent/items/${item.id}`);
          }
        }
      }
    );
  }

  function confirmArchive(item: LearningItem) {
    Alert.alert("Xóa thẻ học", `Xóa thẻ "${item.title}" khỏi danh sách học?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          archiveMutation.mutate(item.id, {
            onSuccess: () => {
              void cleanupOrphanedMediaFiles(repository).catch(() => undefined);
            }
          })
      }
    ]);
  }

  return (
    <Screen scroll={false}>
      <FlashList
        data={filteredItems}
        extraData={filteredItemIds}
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={
          itemsQuery.isLoading ? (
            <StateMessage title="Đang tải thẻ" />
          ) : items.length === 0 ? (
            <StateMessage title="Chưa có thẻ học" />
          ) : (
            <StateMessage title="Không có từ phù hợp" />
          )
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.appHeader}>
              <AppText variant="bodyStrong">KidEDU</AppText>
              <KidButton label="Xong" onPress={() => router.back()} variant="plain" />
            </View>

            <View style={styles.titleBlock}>
              <AppText variant="screenTitle">Quản lý từ vựng</AppText>
              <AppText color="muted" variant="label">
                Theo dõi và tạo từ gần với con
              </AppText>
            </View>

            <View style={styles.actionRow}>
              <KidButton
                icon={<Plus color={colors.onPrimary} size={22} />}
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

            <Card style={styles.statsCard} variant="surface">
              <AppText color="secondary" variant="labelStrong">
                Tổng quan tiến độ
              </AppText>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <AppText variant="sectionTitle">{items.length}</AppText>
                  <AppText align="center" color="muted" variant="caption">
                    Đã thêm
                  </AppText>
                </View>
                <View style={styles.statPill}>
                  <AppText variant="sectionTitle">{practicingCount}</AppText>
                  <AppText align="center" color="muted" variant="caption">
                    Đang luyện
                  </AppText>
                </View>
              </View>
            </Card>

            <Card padding="lg" style={styles.form} variant="form">
              <AppText variant="cardTitle">Tạo thẻ mới</AppText>
              <TextField
                ref={titleInputRef}
                label="Từ vựng"
                onChangeText={setTitle}
                placeholder="Từ hoặc cụm từ"
                value={title}
              />
              <AppText variant="fieldLabel">Danh mục</AppText>
              <CategoryChooser
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
              <KidButton
                disabled={!title.trim() || !categoryId || createMutation.isPending}
                icon={<Plus color={colors.onPrimary} size={22} />}
                label={createMutation.isPending ? "Đang lưu" : "Lưu và thêm media"}
                onPress={createItem}
                variant="secondary"
              />
              <AppText color="muted" variant="caption">
                Sau khi lưu, KidEDU mở thẻ để phụ huynh thêm ảnh, video khẩu hình hoặc âm phát âm.
              </AppText>
            </Card>

            <SectionHeader title="Danh sách từ" />
            <SearchField onChangeText={setSearch} placeholder="Tìm kiếm..." value={search} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onArchive={() => confirmArchive(item)}
            onEdit={() => router.push(`/parent/items/${item.id}`)}
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
    <Card variant="subtle">
      <View style={styles.rowText}>
        <AppText variant="deckTitle">{item.title}</AppText>
        <AppText color="muted" variant="meta">
          {item.categoryName} · {item.status === "hidden" ? "Tạm ẩn" : "Đang hiển thị"}
        </AppText>
        <Badge
          label={label}
          tone={label === "Cần bổ sung" ? "warn" : label === "Đã cá nhân hóa" ? "info" : "good"}
        />
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
    height: spacing[12]
  },
  appHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  titleBlock: {
    gap: spacing[4]
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing[10]
  },
  statsCard: {
    gap: spacing[14]
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[12]
  },
  statPill: {
    alignItems: "center",
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    flex: 1,
    gap: spacing[4],
    padding: spacing[12]
  },
  form: {
    gap: spacing[10]
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8]
  },
  rowText: {
    gap: spacing[6]
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing[8]
  }
});
