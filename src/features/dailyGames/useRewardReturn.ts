import { useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

/** Only a confirmed receipt starts the reveal; background time does not consume it. */
export function useRewardReturn(receiptId?: string) {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      if (!receiptId) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const clear = () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
      };
      const show = () => {
        clear();
        timer = setTimeout(() => router.replace("/games"), 2400);
      };
      if (!AppState.currentState || AppState.currentState === "active") show();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") show();
        else clear();
      });
      return () => {
        clear();
        subscription.remove();
      };
    }, [receiptId, router])
  );
}
