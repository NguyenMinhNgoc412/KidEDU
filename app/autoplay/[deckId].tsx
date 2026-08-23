import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { Screen } from "@/components/Screen";
import { StateMessage } from "@/components/StateMessage";
import { useDeckDetailQuery, useLearningSettingsQuery } from "@/data/queries";
import type { LearningSettings } from "@/data/types";
import { AutoPlaySessionView } from "@/features/autoPlay/AutoPlaySessionView";

export default function AutoPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId: string }>();
  const deckId = params.deckId;
  const deckQuery = useDeckDetailQuery(deckId);
  const settingsQuery = useLearningSettingsQuery();
  const refetchSettings = settingsQuery.refetch;
  const [freshSettings, setFreshSettings] = useState<LearningSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setFreshSettings(null);

      void refetchSettings()
        .then((result) => {
          if (isActive) {
            setFreshSettings(result.data ?? null);
          }
        })
        .catch(() => {
          if (isActive) {
            setFreshSettings(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, [refetchSettings])
  );

  const settingsError = settingsQuery.isError && !freshSettings;
  const isPreparing = deckQuery.isLoading || (!settingsError && !freshSettings);
  const sessionKey = freshSettings
    ? `${deckId}:${freshSettings.playbackSpeed}:${freshSettings.loopCount}:${freshSettings.reinforcementEnabled}:${freshSettings.sfxEnabled}`
    : "preparing";

  return (
    <Screen>
      {isPreparing ? <StateMessage title="Đang chuẩn bị bộ học" /> : null}
      {settingsError ? <StateMessage title="Chưa tải được cài đặt" message="Quay lại và thử mở bộ học lần nữa." /> : null}
      {!isPreparing && !settingsError && !deckQuery.data ? <StateMessage title="Không tìm thấy bộ học" /> : null}
      {!isPreparing && !settingsError && deckQuery.data && freshSettings ? (
        <AutoPlaySessionView
          key={sessionKey}
          deck={deckQuery.data}
          settings={freshSettings}
<<<<<<< Updated upstream
          onExitToHome={() => router.replace("/")}
=======
          onOpenMiniTest={() => router.replace(`/mini-test/${deckId}`)}
          onOpenGames={() => router.replace(`/games/${deckId}`)}
          onExitToHome={() => router.replace("/decks")}
>>>>>>> Stashed changes
        />
      ) : null}
    </Screen>
  );
}
