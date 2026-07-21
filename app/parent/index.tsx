import { useRouter } from "expo-router";
import {
  Archive,
  BookOpen,
  ChartNoAxesColumn,
  Home,
  Layers3,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { useParentGateStore } from "@/features/parent/parentGate";
import { colors, spacing } from "@/theme";

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
        title="KidEDU"
        action={
          <KidButton
            icon={<Home color={colors.primary} size={22} />}
            label="Về học"
            onPress={exitParentArea}
            variant="plain"
          />
        }
      />
      <View style={styles.titleBlock}>
        <AppText variant="screenTitle">Khu phụ huynh</AppText>
        <AppText color="muted" variant="label">
          Quản lý nội dung học, bộ tự chạy và tiến độ của con.
        </AppText>
      </View>
      <View style={styles.grid}>
        <KidButton
          icon={<BookOpen color={colors.onPrimary} size={22} />}
          label="Quản lý từ vựng"
          onPress={() => router.push("/parent/items")}
        />
        <KidButton
          icon={<Layers3 color={colors.onPrimary} size={22} />}
          label="Quản lý bộ học"
          onPress={() => router.push("/parent/decks")}
        />
        <KidButton
          icon={<ChartNoAxesColumn color={colors.onPrimary} size={22} />}
          label="Tiến độ"
          onPress={() => router.push("/parent/progress")}
          variant="secondary"
        />
        <KidButton
          icon={<Settings color={colors.onPrimary} size={22} />}
          label="Cài đặt"
          onPress={() => router.push("/parent/settings")}
          variant="secondary"
        />
        <KidButton
          icon={<Archive color={colors.onPrimary} size={22} />}
          label="Sao lưu dữ liệu"
          onPress={() => router.push("/parent/backup")}
          variant="secondary"
        />
        <KidButton
          icon={<ShieldCheck color={colors.onPrimary} size={22} />}
          label="Quyền riêng tư & dữ liệu"
          onPress={() => router.push("/parent/privacy")}
          variant="secondary"
        />
      </View>
      <Card style={styles.footer} variant="surface">
        <AppText color="muted" variant="label">
          Dữ liệu lưu trên thiết bị này.
        </AppText>
        <KidButton
          icon={<LogOut color={colors.primary} size={22} />}
          label="Khóa khu phụ huynh"
          onPress={exitParentArea}
          variant="plain"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    gap: spacing[5]
  },
  grid: {
    gap: spacing[12]
  },
  footer: {
    gap: spacing[12]
  }
});
