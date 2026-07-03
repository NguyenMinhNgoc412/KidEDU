import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useDeckDetailQuery, useLearningSettingsQuery } from "@/data/queries";
import { AutoPlaySessionView } from "@/features/autoPlay/AutoPlaySessionView";

export default function AutoPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = params.deckId;
  const deckQuery = useDeckDetailQuery(deckId);
  const settingsQuery = useLearningSettingsQuery();
  const refetchSettings = settingsQuery.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchSettings();
    }, [refetchSettings])
  );

  return (
    <Screen scroll={false}>
      {deckQuery.isLoading || settingsQuery.isLoading ? <StateMessage title="Đang chuẩn bị bộ học" /> : null}
      {!deckQuery.isLoading && !deckQuery.data ? <StateMessage title="Không tìm thấy bộ học" /> : null}
      {deckQuery.data && settingsQuery.data ? (
        <AutoPlaySessionView deck={deckQuery.data} settings={settingsQuery.data} onExitToHome={() => router.replace("/")} />
      ) : null}
    </Screen>
  );
}
