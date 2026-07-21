import { useRouter } from "expo-router";
import { Archive, FileCheck2, Share2, ShieldCheck, Upload } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import type { BackupStage, LocalBackupPreview } from "@/features/backup/backupService";
import { useBackupRestore } from "@/features/backup/useBackupRestore";
import { colors, radii, spacing } from "@/theme";

export default function ParentBackupScreen() {
  const router = useRouter();
  const backup = useBackupRestore();
  const { clearRestoreSuccess, restoreSucceeded } = backup;

  useEffect(() => {
    if (!restoreSucceeded) {
      return;
    }

    clearRestoreSuccess();
    Alert.alert(
      "Đã khôi phục dữ liệu",
      "Thẻ học, bộ học, tiến độ, cài đặt và media cá nhân đã được làm mới từ bản sao lưu.",
      [
        {
          text: "Về khu phụ huynh",
          onPress: () => {
            router.replace("/parent");
          }
        }
      ],
      { cancelable: false }
    );
  }, [clearRestoreSuccess, restoreSucceeded, router]);

  function confirmRestore() {
    if (!backup.preparedRestore || backup.isBusy) {
      return;
    }

    Alert.alert(
      "Khôi phục dữ liệu?",
      "Toàn bộ dữ liệu local hiện tại sẽ được thay thế bằng bản sao đã chọn. Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          style: "destructive",
          onPress: () => {
            void backup.restorePreparedBackup();
          }
        }
      ]
    );
  }

  return (
    <Screen>
      <SectionHeader
        title="Sao lưu & khôi phục"
        action={
          <KidButton
            disabled={backup.isBusy}
            label="Xong"
            onPress={() => router.back()}
            variant="plain"
          />
        }
      />

      <Card style={styles.privacyCard} variant="subtle">
        <View style={styles.iconBubble}>
          <ShieldCheck color={colors.primary} size={24} />
        </View>
        <View style={styles.flexText}>
          <AppText variant="cardTitle">Dữ liệu chỉ ở nơi bạn chọn</AppText>
          <AppText color="muted" variant="meta">
            KidEDU không tự tải tệp lên mạng. Tệp có thể chứa ảnh, video và giọng nói; chỉ lưu hoặc
            chuyển tới nơi bạn tin cậy.
          </AppText>
        </View>
      </Card>

      {backup.stage ? <OperationStatus stage={backup.stage} /> : null}

      {backup.errorMessage ? (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <AppText color="danger" variant="bodyStrong">
            {backup.errorMessage}
          </AppText>
        </View>
      ) : null}

      <Card padding="lg" style={styles.actionCard} variant="form">
        <CardHeading
          icon={<Archive color={colors.secondary} size={26} />}
          title="Tạo bản sao lưu"
          description="Gom thẻ học, bộ học, tiến độ, cài đặt và media cá nhân vào một tệp KidEDU."
        />

        <KidButton
          disabled={backup.isBusy}
          icon={<Archive color={colors.onPrimary} size={22} />}
          label={backup.createdBackup ? "Tạo bản sao mới" : "Tạo bản sao lưu"}
          onPress={() => {
            void backup.createBackup();
          }}
          fullWidth
        />

        {backup.createdBackup ? (
          <View style={styles.successBox}>
            <View style={styles.statusTitleRow}>
              <FileCheck2 color={colors.primary} size={22} />
              <AppText variant="bodyStrong">Bản sao đã sẵn sàng</AppText>
            </View>
            <AppText color="muted" numberOfLines={2} variant="meta">
              {backup.createdBackup.fileName}
            </AppText>
            <AppText color="muted" variant="caption">
              {backup.createdBackup.preview.learningItemCount} thẻ ·{" "}
              {backup.createdBackup.preview.deckCount} bộ ·{" "}
              {formatBytes(backup.createdBackup.preview.totalMediaBytes)} media
            </AppText>
            <KidButton
              disabled={backup.isBusy}
              icon={<Share2 color={colors.primary} size={20} />}
              label="Chia sẻ lại"
              onPress={() => {
                void backup.shareCreatedBackup();
              }}
              variant="plain"
            />
          </View>
        ) : null}
      </Card>

      <Card padding="lg" style={styles.actionCard} variant="form">
        <CardHeading
          icon={<Upload color={colors.secondary} size={26} />}
          title="Khôi phục từ tệp"
          description="KidEDU sẽ kiểm tra tệp và cho bạn xem trước trước khi thay đổi dữ liệu."
        />

        <KidButton
          disabled={backup.isBusy}
          icon={<Upload color={colors.onPrimary} size={22} />}
          label={backup.preparedRestore ? "Chọn tệp khác" : "Chọn tệp sao lưu"}
          onPress={() => {
            void backup.selectRestoreFile();
          }}
          variant="secondary"
          fullWidth
        />

        {backup.preparedRestore ? (
          <View style={styles.previewBox}>
            <View style={styles.statusTitleRow}>
              <FileCheck2 color={colors.primary} size={22} />
              <AppText variant="bodyStrong">Bản xem trước</AppText>
            </View>
            <AppText color="muted" numberOfLines={2} variant="meta">
              {backup.preparedRestore.fileName}
            </AppText>
            <PreviewDetails preview={backup.preparedRestore.preview} />
            <View style={styles.integrityRow}>
              <ShieldCheck color={colors.primary} size={20} />
              <AppText color="primary" variant="meta">
                Đã kiểm tra tính toàn vẹn CRC32
              </AppText>
            </View>
            <View style={styles.warningBox}>
              <AppText color="danger" variant="meta">
                Khôi phục sẽ thay thế toàn bộ dữ liệu local hiện tại. Hãy chắc rằng đây là đúng bản
                sao bạn muốn dùng.
              </AppText>
            </View>
            <KidButton
              disabled={backup.isBusy}
              label="Khôi phục dữ liệu"
              onPress={confirmRestore}
              variant="danger"
              fullWidth
            />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

function CardHeading({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.cardHeading}>
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

function OperationStatus({ stage }: { stage: BackupStage }) {
  return (
    <Card style={styles.operationCard} variant="subtle">
      <ActivityIndicator color={colors.primary} size="small" />
      <View style={styles.flexText}>
        <AppText variant="bodyStrong">{stageLabels[stage]}</AppText>
        <AppText color="muted" variant="caption">
          Giữ KidEDU mở cho đến khi thao tác hoàn tất.
        </AppText>
      </View>
    </Card>
  );
}

function PreviewDetails({ preview }: { preview: LocalBackupPreview }) {
  return (
    <View style={styles.previewRows}>
      <PreviewRow label="Tạo lúc" value={formatDate(preview.createdAt)} />
      <PreviewRow label="Phiên bản app" value={preview.appVersion} />
      <PreviewRow label="Thẻ học" value={String(preview.learningItemCount)} />
      <PreviewRow label="Bộ học" value={String(preview.deckCount)} />
      <PreviewRow
        label="Media"
        value={`${preview.mediaAssetCount} mục · ${preview.mediaFileCount} tệp`}
      />
      <PreviewRow label="Dung lượng media" value={formatBytes(preview.totalMediaBytes)} />
      <PreviewRow label="Phiên học" value={String(preview.practiceSessionCount)} />
    </View>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <AppText color="muted" variant="meta">
        {label}
      </AppText>
      <AppText align="right" style={styles.previewValue} variant="meta">
        {value}
      </AppText>
    </View>
  );
}

const stageLabels: Record<BackupStage, string> = {
  preparing_data: "Đang chuẩn bị dữ liệu",
  packing_media: "Đang đóng gói media",
  verifying_backup: "Đang kiểm tra bản sao lưu",
  opening_share: "Đang mở bảng lưu hoặc chia sẻ",
  selecting_file: "Đang chọn tệp sao lưu",
  checking_backup: "Đang kiểm tra tệp",
  restoring_media: "Đang khôi phục media",
  restoring_data: "Đang khôi phục dữ liệu",
  cleaning_up: "Đang hoàn tất và dọn dẹp"
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

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
  actionCard: {
    gap: spacing[16]
  },
  privacyCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12]
  },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12]
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    height: spacing[48],
    justifyContent: "center",
    width: spacing[48]
  },
  flexText: {
    flex: 1,
    gap: spacing[4]
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
    gap: spacing[10],
    padding: spacing[14]
  },
  previewBox: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[12],
    padding: spacing[14]
  },
  statusTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8]
  },
  previewRows: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing[8],
    paddingTop: spacing[12]
  },
  previewRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between"
  },
  previewValue: {
    flex: 1
  },
  integrityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8]
  },
  warningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing[12]
  }
});
