import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Check, Home } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { createParentGateChallenge, isParentGateAnswerCorrect, useParentGateStore } from "@/features/parent/parentGate";
import { colors } from "@/theme";

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
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Khu phụ huynh</Text>
        <Text style={styles.challenge}>{challenge.prompt}</Text>
        <TextInput
          accessibilityLabel="Câu trả lời"
          inputMode="numeric"
          keyboardType="number-pad"
          onChangeText={(text) => {
            setAnswer(text);
            setHasError(false);
          }}
          onSubmitEditing={submit}
          style={[styles.input, hasError ? styles.inputError : null]}
          value={answer}
        />
        {hasError ? <Text style={styles.error}>Chưa đúng, thử lại nhé.</Text> : null}
        <View style={styles.actions}>
          <KidButton icon={<Home color={colors.primary} size={22} />} label="Về học" onPress={() => router.replace("/")} variant="plain" />
          <KidButton icon={<Check color="#FFFFFF" size={22} />} label="Mở" onPress={submit} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 20
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center"
  },
  challenge: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center"
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    minHeight: 64,
    paddingHorizontal: 16,
    textAlign: "center"
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    gap: 12
  }
});
