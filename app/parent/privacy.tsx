import { useRouter } from "expo-router";
import {
  Archive,
  Camera,
  Database,
  History,
  Images,
  Mic,
  RotateCcw,
  ShieldCheck,
  Trash2
} from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import type { PrivacyDataSummary } from "@/data/types";
import { useParentGateStore } from "@/features/parent/parentGate";
import type {
  PrivacyPermissionSnapshot,
  PrivacyPermissionStatus
} from "@/features/privacy/privacyPermissions";
import {
  getPrivacyActionAvailability,
  resetPrivacyDataAndExit
} from "@/features/privacy/privacyScreenActions";
import {
  type PrivacyControlAction,
  usePrivacyControls
} from "@/features/privacy/usePrivacyControls";
import { colors, radii, spacing } from "@/theme";

export default function ParentPrivacyScreen() {
  const router = useRouter();
  const lock = useParentGateStore((state) => state.lock);
  const privacy = usePrivacyControls();
  const availability = getPrivacyActionAvailability(privacy.summary, privacy.isBusy);

  function confirmClearHistory() {
    if (!availability.canClearLearningHistory) {
      return;
    }

    Alert.alert(
      "Xóa lịch sử học?",
      "Các phiên học, lượt tương tác và tiến độ sẽ bị xóa; trạng thái của mọi thẻ trở về Mới. Thẻ, bộ học và media vẫn được giữ lại.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa lịch sử",
          style: "destructive",
          onPress: () => {
            void privacy.clearLearningHistory();
          }
        }
      ]
    );
  }

  function confirmDeleteMedia() {
    if (!availability.canDeletePersonalizedMedia) {
      return;
    }

    Alert.alert(
      "Xóa toàn bộ media cá nhân?",
      "Ảnh, video, âm thanh và ảnh thu nhỏ do gia đình thêm sẽ bị xóa. KidEDU sẽ dùng nội dung mặc định nếu có; thẻ, bộ học và lịch sử học vẫn được giữ lại.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa media",
          style: "destructive",
          onPress: () => {
            void privacy.deletePersonalizedMedia();
          }
        }
      ]
    );
  }

  function confirmResetApp() {
    if (!availability.canResetApp) {
      return;
    }

    Alert.alert(
      "Đặt lại toàn bộ KidEDU?",
      "Toàn bộ nội dung cá nhân, bộ học, lịch sử và cài đặt trong app sẽ bị xóa. Ứng dụng trở về dữ liệu mặc định và thao tác này không thể hoàn tác. Tệp .kidedu đã lưu ngoài app vẫn được giữ; quyền camera, micro và thư viện do hệ điều hành quản lý cũng không bị thu hồi.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đặt lại toàn bộ",
          style: "destructive",
          onPress: () => {
            void resetApp();
          }
        }
      ]
    );
  }

  async function resetApp() {
    const succeeded = await resetPrivacyDataAndExit({
      resetAllLocalData: privacy.resetAllLocalData,
      lockParentZone: lock,
      replaceRoute: (path) => router.replace(path)
    });
    if (!succeeded) {
      return;
    }

    Alert.alert("Đã đặt lại KidEDU", "Ứng dụng đã trở về dữ liệu mặc định.");
  }

  return (
    <Screen>
      <SectionHeader
        title="Quyền riêng tư & dữ liệu"
        action={
          <KidButton
            disabled={!availability.canClose}
            label="Xong"
            onPress={() => router.back()}
            variant="plain"
          />
        }
      />

      <Card style={styles.localOnlyCard} variant="subtle">
        <View style={styles.iconBubble}>
          <ShieldCheck color={colors.primary} size={24} />
        </View>
        <View style={styles.flexText}>
          <AppText variant="cardTitle">Dữ liệu được lưu trên thiết bị</AppText>
          <AppText color="muted" variant="meta">
            KidEDU không có tài khoản, backend hay tự đồng bộ lên cloud. Ảnh, video, giọng nói và
            lịch sử học chỉ ở thiết bị này, trừ khi bạn chủ động tạo bản sao lưu.
          </AppText>
        </View>
      </Card>

      {privacy.activeAction ? <OperationStatus action={privacy.activeAction} /> : null}

      {privacy.errorMessage ? (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <AppText color="danger" variant="bodyStrong">
            {privacy.errorMessage}
          </AppText>
        </View>
      ) : null}

      {privacy.successMessage ? (
        <View accessibilityRole="alert" style={styles.successBox}>
          <AppText color="primary" variant="bodyStrong">
            {privacy.successMessage}
          </AppText>
        </View>
      ) : null}

      <Card padding="lg" style={styles.sectionCard} variant="form">
        <CardHeading
          description="Tổng quan dữ liệu KidEDU đang quản lý trên thiết bị này."
          icon={<Database color={colors.secondary} size={25} />}
          title="Dữ liệu hiện có"
        />
        {privacy.isLoading && !privacy.summary ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <AppText color="muted" variant="meta">
              Đang đọc dữ liệu…
            </AppText>
          </View>
        ) : (
          <DataSummary summary={privacy.summary} />
        )}
      </Card>

      <Card padding="lg" style={styles.sectionCard} variant="form">
        <CardHeading
          description="Màn hình này chỉ đọc trạng thái hiện tại và không tự hiện yêu cầu cấp quyền."
          icon={<ShieldCheck color={colors.secondary} size={25} />}
          title="Quyền trên thiết bị"
        />
        <PermissionRows isLoading={privacy.isLoading} permissions={privacy.permissions} />
        <KidButton
          disabled={privacy.isBusy}
          label="Mở Cài đặt ứng dụng"
          onPress={() => {
            void privacy.openPrivacySettings();
          }}
          variant="plain"
          fullWidth
        />
      </Card>

      <Card padding="lg" style={styles.sectionCard} variant="form">
        <CardHeading
          description="Chọn đúng nhóm dữ liệu cần xóa. Mỗi thao tác đều yêu cầu xác nhận riêng."
          icon={<Trash2 color={colors.secondary} size={25} />}
          title="Dọn dữ liệu"
        />

        <ActionBlock
          description="Xóa phiên học, lượt tương tác và tiến độ; giữ nguyên thẻ, bộ học và media."
          icon={<History color={colors.primary} size={22} />}
          title="Lịch sử học"
        >
          {privacy.summary && !availability.hasLearningHistory ? (
            <AppText color="muted" variant="caption">
              Hiện chưa có lịch sử học cần xóa.
            </AppText>
          ) : null}
          <KidButton
            disabled={!availability.canClearLearningHistory}
            label="Xóa lịch sử học"
            onPress={confirmClearHistory}
            variant="plain"
            fullWidth
          />
        </ActionBlock>

        <ActionBlock
          description="Xóa ảnh, video và âm thanh do gia đình thêm; giữ nguyên nội dung học và lịch sử."
          icon={<Images color={colors.primary} size={22} />}
          title="Media cá nhân hóa"
        >
          {privacy.summary && !availability.hasPersonalizedMedia ? (
            <AppText color="muted" variant="caption">
              Hiện chưa có media cá nhân hóa cần xóa.
            </AppText>
          ) : null}
          <KidButton
            disabled={!availability.canDeletePersonalizedMedia}
            label="Xóa toàn bộ media cá nhân"
            onPress={confirmDeleteMedia}
            variant="plain"
            fullWidth
          />
        </ActionBlock>
      </Card>

      <Card padding="lg" style={styles.dangerCard} variant="form">
        <CardHeading
          description="Xóa toàn bộ dữ liệu local trong app và đưa KidEDU về nội dung mặc định ban đầu."
          icon={<RotateCcw color={colors.danger} size={25} />}
          title="Đặt lại ứng dụng"
        />
        <View style={styles.warningBox}>
          <AppText color="danger" variant="bodyStrong">
            Nên tạo một bản sao lưu trước. Thao tác đặt lại không thể hoàn tác.
          </AppText>
          <AppText color="muted" variant="meta">
            Tệp .kidedu đã lưu ngoài app vẫn được giữ. Quyền camera, micro và thư viện do hệ điều
            hành quản lý sẽ không bị xóa hoặc thu hồi.
          </AppText>
        </View>
        <KidButton
          disabled={!availability.canResetApp}
          icon={<Archive color={colors.primary} size={21} />}
          label="Sao lưu trước"
          onPress={() => router.push("/parent/backup")}
          variant="plain"
          fullWidth
        />
        <KidButton
          disabled={!availability.canResetApp}
          label="Đặt lại toàn bộ app"
          onPress={confirmResetApp}
          variant="danger"
          fullWidth
        />
      </Card>
    </Screen>
  );
}

function CardHeading({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.iconBubble}>{icon}</View>
      <View style={styles.flexText}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText color="muted" variant="meta">
          {description}
        </AppText>
      </View>
    </View>
  );
}

function DataSummary({ summary }: { summary: PrivacyDataSummary | null }) {
  if (!summary) {
    return (
      <AppText color="muted" variant="meta">
        Chưa đọc được tổng quan dữ liệu.
      </AppText>
    );
  }

  return (
    <View style={styles.summaryGrid}>
      <SummaryItem label="Thẻ học" value={String(summary.learningItemCount)} />
      <SummaryItem label="Bộ học" value={String(summary.deckCount)} />
      <SummaryItem label="Phiên học" value={String(summary.practiceSessionCount)} />
      <SummaryItem label="Lượt tương tác" value={String(summary.practiceEventCount)} />
      <SummaryItem label="Tiến độ đã lưu" value={String(summary.learningProgressCount)} />
      <SummaryItem label="Media cá nhân" value={String(summary.personalizedMediaCount)} />
      <SummaryItem label="Dung lượng media" value={formatBytes(summary.personalizedMediaBytes)} />
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <AppText variant="sectionTitle">{value}</AppText>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function PermissionRows({
  permissions,
  isLoading
}: {
  permissions: PrivacyPermissionSnapshot | null;
  isLoading: boolean;
}) {
  return (
    <View style={styles.permissionList}>
      <PermissionRow
        icon={<Camera color={colors.primary} size={21} />}
        isLoading={isLoading}
        label="Camera"
        status={permissions?.camera}
      />
      <PermissionRow
        icon={<Mic color={colors.primary} size={21} />}
        isLoading={isLoading}
        label="Micro"
        status={permissions?.microphone}
      />
      <PermissionRow
        icon={<Images color={colors.primary} size={21} />}
        isLoading={isLoading}
        label="Thư viện ảnh & video"
        status={permissions?.mediaLibrary}
      />
    </View>
  );
}

function PermissionRow({
  icon,
  label,
  status,
  isLoading
}: {
  icon: ReactNode;
  label: string;
  status: PrivacyPermissionStatus | undefined;
  isLoading: boolean;
}) {
  const presentation = status
    ? permissionPresentations[status]
    : { label: isLoading ? "Đang đọc" : "Chưa rõ", tone: "neutral" as const };
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionLabel}>
        {icon}
        <AppText variant="labelStrong">{label}</AppText>
      </View>
      <Badge label={presentation.label} tone={presentation.tone} />
    </View>
  );
}

function ActionBlock({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.actionBlock}>
      <View style={styles.actionTitleRow}>
        {icon}
        <AppText variant="bodyStrong">{title}</AppText>
      </View>
      <AppText color="muted" variant="meta">
        {description}
      </AppText>
      {children}
    </View>
  );
}

function OperationStatus({ action }: { action: PrivacyControlAction }) {
  return (
    <Card style={styles.operationCard} variant="subtle">
      <ActivityIndicator color={colors.primary} size="small" />
      <View style={styles.flexText}>
        <AppText variant="bodyStrong">{actionLabels[action]}</AppText>
        <AppText color="muted" variant="caption">
          Giữ KidEDU mở cho đến khi thao tác hoàn tất.
        </AppText>
      </View>
    </Card>
  );
}

const actionLabels: Record<PrivacyControlAction, string> = {
  opening_settings: "Đang mở Cài đặt ứng dụng",
  clearing_history: "Đang xóa lịch sử học",
  deleting_media: "Đang xóa media cá nhân hóa",
  resetting_app: "Đang đặt lại KidEDU"
};

const permissionPresentations: Record<
  PrivacyPermissionStatus,
  { label: string; tone: "neutral" | "good" | "warn" | "info" }
> = {
  granted: { label: "Đã cấp", tone: "good" },
  limited: { label: "Giới hạn", tone: "warn" },
  denied: { label: "Chưa cấp", tone: "warn" },
  blocked: { label: "Cần cài đặt", tone: "warn" },
  undetermined: { label: "Chưa hỏi", tone: "neutral" },
  unavailable: { label: "Không hỗ trợ", tone: "neutral" }
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Không rõ";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

const styles = StyleSheet.create({
  localOnlyCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12]
  },
  flexText: {
    flex: 1,
    gap: spacing[4]
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    height: spacing[48],
    justifyContent: "center",
    width: spacing[48]
  },
  operationCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12]
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[14]
  },
  successBox: {
    backgroundColor: colors.successSoft,
    borderColor: colors.primarySoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[14]
  },
  sectionCard: {
    gap: spacing[16]
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12]
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[10],
    justifyContent: "center",
    minHeight: spacing[56]
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[10]
  },
  summaryItem: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: "46%",
    flexGrow: 1,
    gap: spacing[4],
    minWidth: 132,
    padding: spacing[12]
  },
  permissionList: {
    gap: spacing[8]
  },
  permissionRow: {
    alignItems: "center",
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between",
    minHeight: spacing[48],
    paddingVertical: spacing[8]
  },
  permissionLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing[10]
  },
  actionBlock: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[10],
    padding: spacing[14]
  },
  actionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8]
  },
  dangerCard: {
    borderColor: colors.danger,
    gap: spacing[14]
  },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    gap: spacing[6],
    padding: spacing[12]
  }
});
