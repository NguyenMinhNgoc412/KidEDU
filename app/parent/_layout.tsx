import { Redirect, Stack } from "expo-router";

import { useParentGateStore } from "@/features/parent/parentGate";

export default function ParentLayout() {
  const isUnlocked = useParentGateStore((state) => state.isUnlocked);

  if (!isUnlocked) {
    return <Redirect href="/parent-gate" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="game-preview"
        options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
      />
    </Stack>
  );
}
