import { useRouter } from "expo-router";
import {
  Archive,
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  Home,
  Layers3,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Screen } from "@/components/Screen";
import { useParentGateStore } from "@/features/parent/parentGate";
import { colors, radii, spacing } from "@/theme";

export default function ParentHomeScreen() {
  const router = useRouter();
  const lock = useParentGateStore((state) => state.lock);

  function exitParentArea() {
    lock();
    router.replace("/");
  }

  return (
    <Screen
      bottomBar={
        <MobileTabBar
          items={[
            {
              icon: <BookOpen color={colors.muted} size={21} strokeWidth={2.3} />,
              label: "Học",
              onPress: exitParentArea
            },
            {
              active: true,
              icon: <ShieldCheck color={colors.secondary} size={21} strokeWidth={2.3} />,
              label: "Phụ huynh",
              onPress: () => undefined
            }
          ]}
        />
      }
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText color="primary" variant="screenTitle">
              Phụ huynh
            </AppText>
            <AppText color="muted" variant="caption">
              Quản lý hành trình học của con
            </AppText>
          </View>
          <KidButton
            icon={<Home color={colors.primary} size={18} />}
            label="Về học"
            onPress={exitParentArea}
            size="sm"
            variant="plain"
          />
        </View>

        <Card padding="none" style={styles.menuCard} variant="input">
          <ParentMenuRow
            icon={<BookOpen color="#009FB5" size={20} strokeWidth={2.3} />}
            iconBackground="#DDF7FA"
            label="Thẻ học"
            onPress={() => router.push("/parent/items")}
          />
          <ParentMenuRow
            icon={<Layers3 color="#1A9E87" size={20} strokeWidth={2.3} />}
            iconBackground="#DDF6EF"
            label="Bộ học"
            onPress={() => router.push("/parent/decks")}
          />
          <ParentMenuRow
            icon={<ChartNoAxesColumn color={colors.blue} size={20} strokeWidth={2.3} />}
            iconBackground={colors.infoSoft}
            label="Tiến độ"
            onPress={() => router.push("/parent/progress")}
          />
          <ParentMenuRow
            icon={<Settings color={colors.secondary} size={20} strokeWidth={2.3} />}
            iconBackground={colors.secondarySoft}
            label="Cài đặt"
            onPress={() => router.push("/parent/settings")}
          />
          <ParentMenuRow
            icon={<Archive color="#8660B3" size={20} strokeWidth={2.3} />}
            iconBackground="#F0E8FA"
            label="Sao lưu & khôi phục"
            onPress={() => router.push("/parent/backup")}
          />
          <ParentMenuRow
            icon={<ShieldCheck color={colors.primary} size={20} strokeWidth={2.3} />}
            iconBackground={colors.primarySoft}
            label="Quyền riêng tư & dữ liệu"
            onPress={() => router.push("/parent/privacy")}
          />
        </Card>

        <Card style={styles.footer} variant="surface">
          <AppText align="center" color="muted" variant="caption">
            Dữ liệu lưu trên thiết bị này.
          </AppText>
          <KidButton
            fullWidth
            icon={<LogOut color={colors.danger} size={19} />}
            label="Khóa khu phụ huynh"
            onPress={exitParentArea}
            variant="plain"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ParentMenuRow({
  icon,
  iconBackground,
  label,
  onPress
}: {
  icon: ReactNode;
  iconBackground: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed ? styles.menuRowPressed : null]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBackground }]}>{icon}</View>
      <AppText style={styles.menuLabel} variant="bodyStrong">
        {label}
      </AppText>
      <ChevronRight color={colors.muted} size={19} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[16],
    paddingBottom: spacing[12]
  },
  scroll: {
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  titleBlock: {
    flex: 1,
    gap: spacing[2]
  },
  menuCard: {
    overflow: "hidden"
  },
  menuRow: {
    alignItems: "center",
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing[12],
    minHeight: 58,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[8]
  },
  menuRowPressed: {
    backgroundColor: colors.surfaceAlt
  },
  menuIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  menuLabel: {
    flex: 1
  },
  footer: {
    gap: spacing[12]
  }
});
