import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { KidButton } from "@/components/KidButton";
import { spacing } from "@/theme";
import type { LocalChild } from "./useLocalBackend";

export type ChildGender = NonNullable<LocalChild["gender"]>;
export function ChildGenderField({
  value,
  onChange,
  disabled = false
}: {
  value: ChildGender | null;
  onChange: (value: ChildGender) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">Giới tính của con</AppText>
      <AppText color="muted">Phụ huynh chọn để hiển thị nhóm quà sưu tập phù hợp.</AppText>
      {(
        [
          { value: "boy", label: "Bé trai" },
          { value: "girl", label: "Bé gái" }
        ] as const
      ).map((option) => (
        <KidButton
          key={option.value}
          label={`${value === option.value ? "✓ " : ""}${option.label}`}
          accessibilityLabel={option.label}
          selected={value === option.value}
          variant={value === option.value ? "primary" : "plain"}
          onPress={() => onChange(option.value)}
          disabled={disabled}
          fullWidth
        />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({ field: { gap: spacing[12] } });
