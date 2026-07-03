import { useLocalSearchParams, useRouter } from "expo-router";
import { Home } from "lucide-react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { StateMessage } from "@/components/StateMessage";
import { useLearningItemQuery } from "@/data/queries";
import { LearningItemView } from "@/features/learning/LearningItemView";
import { useSingleItemProgress } from "@/features/learning/useSingleItemProgress";
import { colors } from "@/theme";

export default function LearningItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId: string }>();
  const itemId = params.itemId;
  const itemQuery = useLearningItemQuery(itemId);
  const progress = useSingleItemProgress(itemQuery.data?.id ?? null);

  return (
    <Screen>
      <SectionHeader
        title="Thẻ học"
        action={<KidButton icon={<Home color={colors.primary} size={22} />} label="Về học" onPress={() => router.replace("/")} variant="plain" />}
      />
      {itemQuery.isLoading ? <StateMessage title="Đang tải thẻ học" /> : null}
      {!itemQuery.isLoading && !itemQuery.data ? <StateMessage title="Không tìm thấy thẻ" /> : null}
      {itemQuery.data ? <LearningItemView item={itemQuery.data} onReplay={progress.recordReplay} /> : null}
    </Screen>
  );
}
