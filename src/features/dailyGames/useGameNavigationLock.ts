import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "expo-router";

/** Exit is explicit, so a drag or Android edge-back never discards the game screen. */
export function useGameNavigationLock() {
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => subscription.remove();
    }, [])
  );
}
