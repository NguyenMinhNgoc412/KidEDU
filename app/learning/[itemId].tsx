import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useLearningItemQuery, useLearningSettingsQuery } from "@/data/queries";
import { LearningItemView } from "@/features/learning/LearningItemView";
import { useSingleItemProgress } from "@/features/learning/useSingleItemProgress";
import { colors, radii, spacing } from "@/theme";

export default function LearningItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId: string }>();
  const itemId = params.itemId;
  const itemQuery = useLearningItemQuery(itemId);
  const settingsQuery = useLearningSettingsQuery();
  const progress = useSingleItemProgress(itemQuery.data?.id ?? null);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.secondary} size={22} />
        </Pressable>
        <AppText align="center" style={styles.title} variant="cardTitle">
          {itemQuery.data?.categoryName ?? "Thẻ học"}
        </AppText>
      </View>
      {itemQuery.isLoading ? <StateMessage title="Đang tải thẻ học" /> : null}
      {!itemQuery.isLoading && !itemQuery.data ? <StateMessage title="Không tìm thấy thẻ" /> : null}
      {itemQuery.data ? (
        <LearningItemView
          item={itemQuery.data}
          onContinue={() => router.back()}
          onExit={() => router.replace("/")}
          onReplay={progress.recordReplay}
          playbackSpeed={settingsQuery.data?.playbackSpeed}
        />
      ) : null}
    </Screen>
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
  }
});
