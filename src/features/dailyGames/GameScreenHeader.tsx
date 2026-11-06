import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/theme";

export function GameScreenHeader({ title, onBack }: { title: string; onBack(): void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại Trò chơi"
        onPress={onBack}
        style={styles.back}
      >
        <ArrowLeft size={28} color={colors.primary} />
      </Pressable>
      <AppText variant="cardTitle" style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { minWidth: 56, minHeight: 56, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 }
});
