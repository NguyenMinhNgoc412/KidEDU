import { useRouter } from "expo-router";
import { BookOpen, ChartNoAxesColumn, Home, Layers3, LogOut, Settings } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { useParentGateStore } from "@/features/parent/parentGate";
import { colors } from "@/theme";

export default function ParentHomeScreen() {
  const router = useRouter();
  const lock = useParentGateStore((state) => state.lock);

  function exitParentArea() {
    lock();
    router.replace("/");
  }

  return (
    <Screen>
      <SectionHeader
        title="Phụ huynh"
        action={<KidButton icon={<Home color={colors.primary} size={22} />} label="Về học" onPress={exitParentArea} variant="plain" />}
      />
      <View style={styles.grid}>
        <KidButton icon={<BookOpen color="#FFFFFF" size={22} />} label="Thẻ học" onPress={() => router.push("/parent/items")} />
        <KidButton icon={<Layers3 color="#FFFFFF" size={22} />} label="Bộ học" onPress={() => router.push("/parent/decks")} />
        <KidButton icon={<ChartNoAxesColumn color="#FFFFFF" size={22} />} label="Tiến độ" onPress={() => router.push("/parent/progress")} variant="secondary" />
        <KidButton icon={<Settings color="#FFFFFF" size={22} />} label="Cài đặt" onPress={() => router.push("/parent/settings")} variant="secondary" />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Dữ liệu lưu trên thiết bị này.</Text>
        <KidButton icon={<LogOut color={colors.primary} size={22} />} label="Khóa khu phụ huynh" onPress={exitParentArea} variant="plain" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12
  },
  footer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  }
});
