import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play, Star } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { PressableCard } from "@/components/Card";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useCategoriesQuery, useLearningItemsQuery } from "@/data/queries";
import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii, spacing } from "@/theme";

export default function ChildCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId;
  const categoriesQuery = useCategoriesQuery();
  const itemsQuery = useLearningItemsQuery({ childOnly: true });
  const refetchItems = itemsQuery.refetch;
  const category = (categoriesQuery.data ?? []).find((item) => item.id === categoryId);
  const items = (itemsQuery.data ?? []).filter((item) => item.categoryId === categoryId);

  useFocusEffect(
    useCallback(() => {
      void refetchItems();
    }, [refetchItems])
  );

  return (
    <Screen scroll={false}>
      <FlashList
        data={items}
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={
          !itemsQuery.isLoading ? (
            <StateMessage
              title="Chưa có từ trong nhóm này"
              message="Từ phụ huynh thêm sẽ xuất hiện ở đây khi đang hiển thị."
            />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
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
                {category?.name ?? "Nhóm học"}
              </AppText>
            </View>
            {itemsQuery.isLoading ? <StateMessage title="Đang tải từ" /> : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <WordRow item={item} tone={index % 2 === 0 ? colors.surface : colors.surfaceAlt} />
        )}
        style={styles.list}
      />
    </Screen>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

function WordRow({ item, tone }: { item: LearningItem; tone: string }) {
  const router = useRouter();
  const resolved = resolveLearningItemMedia(item);
  const media = resolved.byRole.illustration ?? resolved.byRole.mouth_video;
  const role = resolved.byRole.illustration ? "illustration" : "mouth_video";
  const isFamiliar = item.learningStatus === "familiar";

  return (
    <PressableCard
      accessibilityLabel={`Học từ ${item.title}`}
      accessibilityRole="button"
      onPress={() => router.push(`/learning/${item.id}`)}
      style={[styles.wordRow, { backgroundColor: tone }]}
    >
      <View style={styles.preview}>
        <MediaPlaceholder compact media={media} role={role} />
      </View>
      <View style={styles.wordText}>
        <AppText numberOfLines={2} variant="deckTitle">
          {item.title}
        </AppText>
      </View>
      <View style={[styles.statusIcon, isFamiliar ? styles.starIcon : styles.playIcon]}>
        {isFamiliar ? (
          <Star color={colors.coral} fill={colors.yellow} size={18} />
        ) : (
          <Play color={colors.primary} size={17} />
        )}
      </View>
    </PressableCard>
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
    borderRadius: radii.full,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  title: {
    flex: 1
  },
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
    height: spacing[14]
  },
  wordRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[14],
    minHeight: 82,
    padding: spacing[10]
  },
  preview: {
    height: 58,
    width: 58
  },
  wordText: {
    flex: 1
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  starIcon: {
    backgroundColor: colors.starSoft
  },
  playIcon: {
    backgroundColor: colors.surfaceContainer
  }
});
