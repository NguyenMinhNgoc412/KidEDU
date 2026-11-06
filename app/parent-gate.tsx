import { useLocalSearchParams, useRouter } from "expo-router";
import { AppState, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useParentHold } from "@/features/parent/useParentHold";
import { localFixtureEnabled } from "@/features/lessonRuntime/fixtureBoundary";
import { colors, radii, spacing } from "@/theme";

export default function ParentGateScreen() {
  const router = useRouter();
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  const hold = useParentHold(openParentArea);

  function openParentArea() {
    if (AppState.currentState && AppState.currentState !== "active") return;
    useParentGateStore.getState().unlock();
    router.replace(
      destination === "game-preview" && localFixtureEnabled()
        ? "/parent/game-preview"
        : destination === "practice"
          ? "/parent/practice"
          : destination === "profiles"
            ? "/parent/profiles"
            : "/parent"
    );
  }

  return (
    <Screen>
      <View style={styles.backdrop}>
        <Card padding="lg" style={styles.container} variant="form">
          <AppText align="center" variant="screenTitle">
            Khu phụ huynh
          </AppText>
          <AppText align="center" color="muted">
            Người lớn nhấn và giữ nút bên dưới để mở khu quản lý.
          </AppText>
          <AppText align="center" color="muted" variant="caption">
            Nếu dùng trình đọc màn hình, chạm hai lần và giữ. Trên máy tính, giữ phím cách.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhấn giữ để mở khu phụ huynh"
            accessibilityHint="Giữ khoảng hai giây, thả sớm để hủy."
            onPressIn={hold.begin}
            onPressOut={hold.end}
            style={[styles.holdButton, hold.holding ? styles.holding : null]}
          >
            <AppText align="center" color="onPrimary" variant="bodyStrong">
              {hold.holding ? "Tiếp tục giữ…" : "Nhấn giữ để mở"}
            </AppText>
          </Pressable>
          <KidButton label="Về học" onPress={() => router.replace("/")} variant="plain" />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", paddingVertical: spacing[24] },
  container: { gap: spacing[16], width: "100%" },
  holdButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minHeight: 64,
    justifyContent: "center",
    padding: spacing[16]
  },
  holding: { backgroundColor: colors.primaryDark }
});
