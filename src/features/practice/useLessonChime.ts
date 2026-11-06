import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useLearningSettingsQuery } from "@/data/queries";

/** Cosmetic local feedback: never blocks progress or replays after pause. */
export function useLessonChime(ready: boolean, paused: boolean) {
  const settings = useLearningSettingsQuery();
  const player = useAudioPlayer(
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles this local asset.
    require("../../../assets/practice-fixtures/lesson-complete-v1.wav")
  );
  const attempted = useRef(ready);
  useEffect(() => {
    if (!ready || paused || !settings.data) return;
    if (attempted.current) return;
    attempted.current = true;
    if (!settings.data.sfxEnabled || AppState.currentState === "background") return;
    try {
      player.volume = 0.55;
      player.loop = false;
      player.play();
    } catch {
      /* Optional sound. */
    }
  }, [ready, paused, settings.data, player]);
  useEffect(() => {
    if (paused || settings.data?.sfxEnabled === false) player.pause();
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => {
      listener.remove();
      player.pause();
    };
  }, [paused, player, settings.data?.sfxEnabled]);
}
