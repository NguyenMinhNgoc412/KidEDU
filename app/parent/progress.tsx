import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/Badge";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useProgressSummaryQuery, useUpdateProgressParentMarkMutation } from "@/data/queries";
import type { LearningStatus, ProgressSummaryItem } from "@/data/types";
import { colors, fontSizes, fontWeights, radii, spacing } from "@/theme";

export default function ParentProgressScreen() {
  const router = useRouter();
  const progressQuery = useProgressSummaryQuery();
  const updateMarkMutation = useUpdateProgressParentMarkMutation();
  const progress = progressQuery.data ?? [];

  return (
    <Screen scroll={false}>
      <FlashList
        data={progress}
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={
          !progressQuery.isLoading ? <StateMessage title="Chưa có lượt học" /> : null
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SectionHeader
              title="Tiến độ"
              action={<KidButton label="Xong" onPress={() => router.back()} variant="plain" />}
            />
            {progressQuery.isLoading ? <StateMessage title="Đang tải tiến độ" /> : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.learningItemId}
        renderItem={({ item }) => (
          <ProgressRow
            disabled={updateMarkMutation.isPending}
            item={item}
            onMark={(parentMark) =>
              updateMarkMutation.mutate({ learningItemId: item.learningItemId, parentMark })
            }
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

function ProgressRow({
  item,
  disabled,
  onMark
}: {
  item: ProgressSummaryItem;
  disabled?: boolean;
  onMark(parentMark: LearningStatus): void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            Xem {item.viewCount} · Luyện {item.practiceCount}
          </Text>
          <Text style={styles.date}>
            {item.lastPracticedAt
              ? new Date(item.lastPracticedAt).toLocaleString()
              : "Chưa có ngày"}
          </Text>
        </View>
        <Badge
          label={markLabel[item.parentMark]}
          tone={item.parentMark === "familiar" ? "good" : "info"}
        />
      </View>
      <View style={styles.markActions}>
        {markOptions.map((option) => (
          <KidButton
            key={option.value}
            disabled={disabled}
            label={option.label}
            onPress={() => onMark(option.value)}
            variant={item.parentMark === option.value ? "secondary" : "plain"}
          />
        ))}
      </View>
    </View>
  );
}

const markLabel: Record<ProgressSummaryItem["parentMark"], string> = {
  new: "Mới",
  practicing: "Đang luyện",
  familiar: "Đã quen"
};

const markOptions: Array<{ label: string; value: LearningStatus }> = [
  { label: "Mới", value: "new" },
  { label: "Đang luyện", value: "practicing" },
  { label: "Đã quen", value: "familiar" }
];

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
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[12],
    padding: spacing[12]
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between"
  },
  textWrap: {
    flex: 1,
    gap: spacing[4]
  },
  title: {
    color: colors.text,
    fontSize: fontSizes[20],
    fontWeight: fontWeights.black
  },
  meta: {
    color: colors.muted,
    fontSize: fontSizes[14],
    fontWeight: fontWeights.extraBold
  },
  date: {
    color: colors.muted,
    fontSize: fontSizes[12],
    fontWeight: fontWeights.bold
  },
  markActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8]
  }
});
