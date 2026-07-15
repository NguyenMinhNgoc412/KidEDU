import { FlashList } from "@shopify/flash-list";
import { ArrowDown, ArrowUp, Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { SearchField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import type { LearningItem } from "@/data/types";
import { colors, radii, spacing } from "@/theme";

const chooserMaxHeight = 360;
const chooserRowHeight = 92;

export function DeckItemChooser({
  items,
  selectedIds,
  onToggle,
  onMove
}: {
  items: LearningItem[];
  selectedIds: string[];
  onToggle: (itemId: string) => void;
  onMove?: (itemId: string, direction: "up" | "down") => void;
}) {
  const [search, setSearch] = useState("");
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

  return (
    <View style={styles.container}>
      <SearchField
        onChangeText={setSearch}
        placeholder="Tìm từ để thêm vào bộ..."
        value={search}
      />
      <FlashList
        data={filteredItems}
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={
          <AppText align="center" color="muted" variant="meta">
            Không có từ phù hợp
          </AppText>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const selectedIndex = selectedIds.indexOf(item.id);
          const isSelected = selectedIndex >= 0;

          return (
            <Card style={[styles.row, isSelected ? styles.selected : null]} variant="input">
              <View style={styles.textWrap}>
                <AppText variant="cardTitle">{item.title}</AppText>
                <AppText color="muted" variant="meta">
                  {item.categoryName}
                </AppText>
              </View>
              {isSelected && onMove ? (
                <View style={styles.moveWrap}>
                  <KidButton
                    disabled={selectedIndex === 0}
                    icon={<ArrowUp color={colors.primary} size={18} />}
                    label="Lên"
                    onPress={() => onMove(item.id, "up")}
                    variant="plain"
                  />
                  <KidButton
                    disabled={selectedIndex === selectedIds.length - 1}
                    icon={<ArrowDown color={colors.primary} size={18} />}
                    label="Xuống"
                    onPress={() => onMove(item.id, "down")}
                    variant="plain"
                  />
                </View>
              ) : null}
              <KidButton
                icon={isSelected ? <Check color={colors.onPrimary} size={18} /> : undefined}
                label={isSelected ? `${selectedIndex + 1}` : "Chọn"}
                onPress={() => onToggle(item.id)}
                variant={isSelected ? "primary" : "plain"}
              />
            </Card>
          );
        }}
        style={{
          borderRadius: radii.lg,
          height: Math.min(Math.max(filteredItems.length, 1) * chooserRowHeight, chooserMaxHeight)
        }}
      />
    </View>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[10]
  },
  listContent: {
    paddingBottom: spacing[2]
  },
  listGap: {
    height: spacing[8]
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[10],
    padding: spacing[10]
  },
  selected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  textWrap: {
    flex: 1,
    gap: spacing[4]
  },
  moveWrap: {
    gap: spacing[6]
  }
});
