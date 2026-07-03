import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play, Star } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useCategoriesQuery, useLearningItemsQuery } from "@/data/queries";
import type { LearningItem } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii } from "@/theme";

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
    <Screen>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Quay lại" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.secondary} size={22} />
        </Pressable>
        <Text style={styles.title}>{category?.name ?? "Nhóm học"}</Text>
      </View>

      {itemsQuery.isLoading ? <StateMessage title="Đang tải từ" /> : null}
      {!itemsQuery.isLoading && items.length === 0 ? (
        <StateMessage title="Chưa có từ trong nhóm này" message="Từ phụ huynh thêm sẽ xuất hiện ở đây khi đang hiển thị." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <WordRow item={item} tone={index % 2 === 0 ? colors.surface : colors.surfaceAlt} />}
          scrollEnabled={false}
        />
      )}
    </Screen>
  );
}

function WordRow({ item, tone }: { item: LearningItem; tone: string }) {
  const router = useRouter();
  const resolved = resolveLearningItemMedia(item);
  const media = resolved.byRole.illustration ?? resolved.byRole.mouth_video;
  const role = resolved.byRole.illustration ? "illustration" : "mouth_video";
  const isFamiliar = item.learningStatus === "familiar";

  return (
    <Pressable
      accessibilityLabel={`Học từ ${item.title}`}
      accessibilityRole="button"
      onPress={() => router.push(`/learning/${item.id}`)}
      style={({ pressed }) => [styles.wordRow, { backgroundColor: tone }, pressed ? styles.pressed : null]}
    >
      <View style={styles.preview}>
        <MediaPlaceholder compact media={media} role={role} />
      </View>
      <View style={styles.wordText}>
        <Text style={styles.wordTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      <View style={[styles.statusIcon, isFamiliar ? styles.starIcon : styles.playIcon]}>
        {isFamiliar ? <Star color={colors.coral} fill={colors.yellow} size={18} /> : <Play color={colors.primary} size={17} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
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
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  wordRow: {
    alignItems: "center",
    borderColor: "rgba(80, 97, 63, 0.1)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    minHeight: 82,
    padding: 10
  },
  preview: {
    height: 58,
    width: 58
  },
  wordText: {
    flex: 1
  },
  wordTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  starIcon: {
    backgroundColor: "#FFE8B9"
  },
  playIcon: {
    backgroundColor: colors.surfaceContainer
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }]
  }
});
