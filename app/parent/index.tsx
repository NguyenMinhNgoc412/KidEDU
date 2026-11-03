import { useRouter } from "expo-router";
import {
  Archive,
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  Home,
  Image,
  Layers3,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { LocalObservationsCard } from "@/features/lessonRuntime/LocalObservationsCard";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Screen } from "@/components/Screen";
import { useParentGateStore } from "@/features/parent/parentGate";
import { useAuth } from "@/features/auth/AuthProvider";
import { useParentDashboard } from "@/features/parent/useParentDashboard";
import { colors, radii, spacing } from "@/theme";

const subscriptionLabels: Record<string, string> = {
  none: "Chưa có gói học",
  trial_active: "Đang dùng thử",
  active: "Gói đang hoạt động",
  grace_period: "Trong thời gian gia hạn",
  billing_retry: "Đang thử thanh toán lại",
  canceled_active: "Đã hủy, còn hiệu lực",
  expired: "Gói đã hết hạn",
  refunded: "Đã hoàn tiền",
  revoked: "Quyền đã thu hồi",
  account_hold: "Tài khoản đang tạm giữ"
};
const observationLabels: Record<string, string> = {
  independent: "Độc lập",
  supported: "Có hỗ trợ",
  not_yet: "Chưa thực hiện",
  not_observed: "Chưa quan sát"
};

export default function ParentHomeScreen() {
  const router = useRouter();
  const lock = useParentGateStore((state) => state.lock);
  const { signOut } = useAuth();
  const dashboard = useParentDashboard();
  const latestObservation = dashboard.observations.find((item) => !item.supersededById);

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
              Cùng con mỗi ngày
            </AppText>
            <AppText color="muted" variant="caption">
              Kế hoạch, quan sát và nội dung gia đình ở một nơi
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

        {dashboard.error ? (
          <Card padding="lg" style={styles.overviewCard} variant="subtle">
            <AppText variant="cardTitle">Chưa tải được dữ liệu gia đình</AppText>
            <AppText color="muted">Kiểm tra kết nối app server rồi thử lại.</AppText>
            <KidButton label="Tải lại" onPress={dashboard.refresh} variant="plain" />
          </Card>
        ) : null}

        <Card padding="lg" style={styles.overviewCard} variant="surface">
          <AppText color="primary" variant="labelStrong">
            HỒ SƠ ĐANG XEM
          </AppText>
          {dashboard.loading ? <AppText color="muted">Đang tải dữ liệu…</AppText> : null}
          {dashboard.children.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childList}
            >
              {dashboard.children.map((child) => {
                const selected = dashboard.selected?.id === child.id;
                return (
                  <Pressable
                    key={child.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Xem hồ sơ ${child.displayName}`}
                    accessibilityState={{ selected }}
                    onPress={() => dashboard.selectChild(child.id)}
                    style={[styles.childChip, selected ? styles.childChipSelected : null]}
                  >
                    <AppText color={selected ? "onPrimary" : "primary"} variant="labelStrong">
                      {child.displayName}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <AppText color="muted">
              {dashboard.error
                ? "Không tải được hồ sơ."
                : dashboard.loading
                  ? "Đang tải hồ sơ…"
                  : "Chưa có hồ sơ trẻ trên server."}
            </AppText>
          )}
          {__DEV__ && dashboard.children.length === 0 ? (
            <KidButton
              label="Tạo hồ sơ thử trên server"
              onPress={() => router.push("/parent/local-api")}
              variant="plain"
            />
          ) : null}
        </Card>

        <Card padding="lg" style={styles.overviewCard} variant="subtle">
          <AppText color="primary" variant="labelStrong">
            KẾ HOẠCH HỌC
          </AppText>
          {dashboard.plan?.document ? (
            <>
              <AppText variant="cardTitle">
                {dashboard.plan.document.items.length} bài trong kế hoạch
              </AppText>
              <AppText color="muted">
                {dashboard.plan.document.goalIds.length} mục tiêu · bản cập nhật{" "}
                {dashboard.plan.revision}
              </AppText>
            </>
          ) : (
            <AppText color="muted">
              {dashboard.error
                ? "Không tải được kế hoạch."
                : dashboard.loading
                  ? "Đang tải kế hoạch…"
                  : "Chưa có kế hoạch đã đồng bộ cho hồ sơ này."}
            </AppText>
          )}
          <AppText color="muted" variant="caption">
            Bài học chỉ bắt đầu sau khi quyền học và nội dung đã sẵn sàng.
          </AppText>
          <KidButton
            label="Chọn bài cùng con"
            disabled={!dashboard.selected || dashboard.loading || Boolean(dashboard.error)}
            onPress={() => router.push("/parent/lessons")}
          />
        </Card>

        <Card padding="lg" style={styles.overviewCard} variant="input">
          <AppText color="primary" variant="labelStrong">
            QUAN SÁT GẦN ĐÂY
          </AppText>
          {latestObservation ? (
            <>
              <AppText variant="cardTitle">
                {observationLabels[latestObservation.result] ?? "Đã ghi nhận"}
              </AppText>
              <AppText color="muted">
                {latestObservation.context === "parent_guided"
                  ? "Luyện cùng phụ huynh"
                  : "Trong bài học"}{" "}
                · {new Date(latestObservation.occurredAt).toLocaleDateString("vi-VN")}
              </AppText>
            </>
          ) : (
            <AppText color="muted">
              {dashboard.error
                ? "Không tải được quan sát."
                : dashboard.loading
                  ? "Đang tải quan sát…"
                  : "Chưa có quan sát nào được đồng bộ cho hồ sơ này."}
            </AppText>
          )}
        </Card>

        <Card padding="lg" style={styles.overviewCard} variant="surface">
          <AppText color="primary" variant="labelStrong">
            GÓI HỌC
          </AppText>
          <AppText variant="cardTitle">
            {dashboard.subscription
              ? (subscriptionLabels[dashboard.subscription.state] ?? dashboard.subscription.state)
              : "Đang kiểm tra"}
          </AppText>
          <AppText color="muted">
            {dashboard.subscription?.learningAllowed
              ? "Quyền học đang có hiệu lực trên server."
              : "Nội dung học đang khóa. Dữ liệu gia đình vẫn xem được."}
          </AppText>
          {dashboard.subscription?.accessUntil ? (
            <AppText color="muted" variant="caption">
              Hiệu lực đến{" "}
              {new Date(dashboard.subscription.accessUntil).toLocaleDateString("vi-VN")}
            </AppText>
          ) : null}
        </Card>

        {dashboard.selected ? (
          <LocalObservationsCard key={dashboard.selected.id} childId={dashboard.selected.id} />
        ) : null}
        <AppText variant="cardTitle">Quản lý trên thiết bị</AppText>

        <Card padding="none" style={styles.menuCard} variant="input">
          {__DEV__ ? (
            <ParentMenuRow
              icon={<ShieldCheck color={colors.primary} size={20} strokeWidth={2.3} />}
              iconBackground={colors.primarySoft}
              label="Dữ liệu server (local)"
              onPress={() => router.push("/parent/local-api")}
            />
          ) : null}
          <ParentMenuRow
            icon={<Image color={colors.primary} size={20} strokeWidth={2.3} />}
            iconBackground={colors.primarySoft}
            label="Media gia đình trên thiết bị"
            onPress={() => router.push("/parent/items")}
          />
          <ParentMenuRow
            icon={<Layers3 color="#1A9E87" size={20} strokeWidth={2.3} />}
            iconBackground="#DDF6EF"
            label="Bộ luyện cũ trên thiết bị"
            onPress={() => router.push("/parent/decks")}
          />
          <ParentMenuRow
            icon={<ChartNoAxesColumn color={colors.blue} size={20} strokeWidth={2.3} />}
            iconBackground={colors.infoSoft}
            label="Tiến độ cũ trên thiết bị"
            onPress={() => router.push("/parent/progress")}
          />
        </Card>

        <AppText variant="cardTitle">Cài đặt & dữ liệu</AppText>
        <Card padding="none" style={styles.menuCard} variant="input">
          <ParentMenuRow
            icon={<Settings color={colors.secondary} size={20} strokeWidth={2.3} />}
            iconBackground={colors.secondarySoft}
            label="Cài đặt"
            onPress={() => router.push("/parent/settings")}
          />
          <ParentMenuRow
            icon={<Archive color="#8660B3" size={20} strokeWidth={2.3} />}
            iconBackground="#F0E8FA"
            label="Xuất & khôi phục dữ liệu trên thiết bị"
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
          <KidButton
            fullWidth
            label="Đăng xuất tài khoản"
            onPress={() => void signOut()}
            variant="plain"
          />
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
  overviewCard: {
    gap: spacing[10]
  },
  childList: { gap: spacing[8], paddingVertical: spacing[4] },
  childChip: {
    borderColor: colors.primary,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing[16]
  },
  childChipSelected: { backgroundColor: colors.primary },
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
