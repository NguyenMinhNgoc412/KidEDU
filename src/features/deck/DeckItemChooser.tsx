import { FlashList } from "@shopify/flash-list";
import { ArrowDown, ArrowUp, Check } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import type { LearningItem } from "@/data/types";
import { colors, radii } from "@/theme";

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
  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const selectedIndex = selectedIds.indexOf(item.id);
        const isSelected = selectedIndex >= 0;

        return (
          <View style={[styles.row, isSelected ? styles.selected : null]}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.categoryName}</Text>
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
              icon={isSelected ? <Check color="#FFFFFF" size={18} /> : undefined}
              label={isSelected ? `${selectedIndex + 1}` : "Chọn"}
              onPress={() => onToggle(item.id)}
              variant={isSelected ? "primary" : "plain"}
            />
          </View>
        );
      }}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "#FFFDF2",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    padding: 10
  },
  selected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  textWrap: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  moveWrap: {
    gap: 6
  }
});
