import { BlurView } from "expo-blur";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Check, Home } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import {
  createParentGateChallenge,
  isParentGateAnswerCorrect,
  useParentGateStore
} from "@/features/parent/parentGate";
import { colors, fontFamilies, fontSizes, spacing } from "@/theme";

export default function ParentGateScreen() {
  const router = useRouter();
  const unlock = useParentGateStore((state) => state.unlock);
  const challenge = useMemo(() => createParentGateChallenge(), []);
  const [answer, setAnswer] = useState("");
  const [hasError, setHasError] = useState(false);

  function submit() {
    if (isParentGateAnswerCorrect(answer, challenge)) {
      unlock();
      router.replace("/parent");
      return;
    }

    setHasError(true);
    setAnswer("");
  }

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.backdrop}>
        <BlurView intensity={20} style={styles.blurLayer} tint="light" />
        <Card padding="lg" style={styles.container} variant="form">
          <AppText align="center" variant="screenTitle">
            Khu phụ huynh
          </AppText>
          <AppText align="center" color="muted" variant="label">
            Người lớn trả lời phép tính để mở khu quản lý.
          </AppText>
          <AppText align="center" color="primary" variant="learningTitle">
            {challenge.prompt}
          </AppText>
          <TextField
            accessibilityLabel="Câu trả lời"
            error={hasError}
            inputMode="numeric"
            inputStyle={styles.input}
            keyboardType="number-pad"
            onChangeText={(text) => {
              setAnswer(text);
              setHasError(false);
            }}
            onSubmitEditing={submit}
            value={answer}
          />
          {hasError ? (
            <AppText align="center" color="danger" variant="labelStrong">
              Chưa đúng, thử lại nhé.
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <KidButton
              icon={<Home color={colors.primary} size={22} />}
              label="Về học"
              onPress={() => router.replace("/")}
              variant="plain"
            />
            <KidButton
              icon={<Check color={colors.onPrimary} size={22} />}
              label="Mở"
              onPress={submit}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: colors.surfaceHigh,
    flex: 1,
    justifyContent: "center",
    padding: spacing[24]
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(253, 250, 232, 0.58)"
  },
  container: {
    gap: spacing[16],
    maxWidth: 420,
    width: "100%"
  },
  input: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes[28],
    minHeight: 64,
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[12],
    justifyContent: "center"
  }
});
