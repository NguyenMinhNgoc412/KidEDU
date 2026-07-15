import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Mic2,
  Square,
  Trash2,
  Video,
  Volume2
} from "lucide-react-native";
import { useEffect, type ReactNode } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { useKidEduRepository } from "@/data/KidEduDataProvider";
import type { LearningItem, LearningItemMedia, MediaRole } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, spacing } from "@/theme";

import { cleanupOrphanedMediaFiles } from "./mediaCleanupService";
import { cleanupTempMediaImports } from "./mediaImportService";
import {
  ensureAudioRecordingPermission,
  ensureMediaLibraryPermission,
  ensureMouthVideoCapturePermission
} from "./mediaPermissions";
import {
  useDeleteCustomMediaMutation,
  useSavePickedMediaMutation,
  useSaveRecordedAudioMutation
} from "./useMediaPersonalization";

export function PersonalizedMediaSection({ item }: { item: LearningItem }) {
  const repository = useKidEduRepository();
  const resolved = resolveLearningItemMedia(item);
  const saveMediaMutation = useSavePickedMediaMutation(item.id);
  const saveAudioMutation = useSaveRecordedAudioMutation(item.id);
  const deleteMediaMutation = useDeleteCustomMediaMutation(item.id);
  const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const isRecordingAudio = audioRecorderState.isRecording;
  const isMutationBusy =
    saveMediaMutation.isPending || saveAudioMutation.isPending || deleteMediaMutation.isPending;
  const isBusy = isMutationBusy || isRecordingAudio;

  useEffect(() => {
    void cleanupTempMediaImports();
    void cleanupOrphanedMediaFiles(repository);
  }, [repository]);

  useEffect(() => {
    return () => {
      if (audioRecorder.getStatus().isRecording) {
        void audioRecorder.stop();
      }
    };
  }, [audioRecorder]);

  async function pickMedia(role: MediaRole) {
    try {
      await ensureMediaLibraryPermission();
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: role === "illustration",
        allowsMultipleSelection: false,
        aspect: role === "illustration" ? [4, 3] : undefined,
        base64: false,
        mediaTypes: role === "illustration" ? ["images"] : ["videos"],
        quality: role === "illustration" ? 0.82 : 0.7,
        selectionLimit: 1,
        videoMaxDuration: 15
      });

      if (result.canceled) {
        return;
      }

      const [asset] = result.assets;
      if (!asset) {
        return;
      }

      saveMediaMutation.mutate(
        { role, asset },
        {
          onError: (error) => Alert.alert("Chưa lưu được media", getErrorMessage(error))
        }
      );
    } catch (error) {
      Alert.alert("Chưa mở được thư viện", getErrorMessage(error));
    }
  }

  async function captureVideo() {
    try {
      await ensureMouthVideoCapturePermission();
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        base64: false,
        cameraType: ImagePicker.CameraType.front,
        mediaTypes: ["videos"],
        quality: 0.7,
        videoMaxDuration: 15,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium
      });

      if (result.canceled) {
        return;
      }

      const [asset] = result.assets;
      if (!asset) {
        return;
      }

      saveMediaMutation.mutate(
        { role: "mouth_video", asset },
        {
          onError: (error) => Alert.alert("Chưa lưu được video", getErrorMessage(error))
        }
      );
    } catch (error) {
      Alert.alert("Chưa mở được camera", getErrorMessage(error));
    }
  }

  async function startAudioRecording() {
    try {
      await ensureAudioRecordingPermission();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
      audioRecorder.record();
    } catch (error) {
      Alert.alert("Chưa thu âm được", getErrorMessage(error));
    }
  }

  async function stopAudioRecording() {
    try {
      await audioRecorder.stop();
      const status = audioRecorder.getStatus();
      const uri = status.url ?? audioRecorder.uri;

      if (!uri) {
        throw new Error("Không tìm thấy tệp thu âm.");
      }

      saveAudioMutation.mutate(
        {
          durationMs: status.durationMillis,
          mimeType: uri.endsWith(".webm") ? "audio/webm" : "audio/m4a",
          uri
        },
        {
          onError: (error) => Alert.alert("Chưa lưu được thu âm", getErrorMessage(error))
        }
      );
    } catch (error) {
      Alert.alert("Chưa dừng được thu âm", getErrorMessage(error));
    } finally {
      void setAudioModeAsync({ allowsRecording: false });
    }
  }

  function confirmDelete(role: MediaRole) {
    Alert.alert("Xóa media cá nhân", "Thẻ sẽ quay về media mặc định nếu có.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          deleteMediaMutation.mutate(role, {
            onError: (error) => Alert.alert("Chưa xóa được media", getErrorMessage(error))
          })
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <AppText variant="cardTitle">Media cá nhân</AppText>
      <MediaRoleRow
        disabled={isBusy}
        icon={<ImageIcon color={colors.primary} size={20} />}
        label="Ảnh minh họa"
        media={resolved.byRole.illustration}
        onDelete={() => confirmDelete("illustration")}
        onPick={() => void pickMedia("illustration")}
        pickLabel="Chọn ảnh"
        role="illustration"
      />
      <MediaRoleRow
        disabled={isBusy}
        icon={<Video color={colors.coral} size={20} />}
        label="Video khẩu hình"
        media={resolved.byRole.mouth_video}
        onCapture={captureVideo}
        onDelete={() => confirmDelete("mouth_video")}
        onPick={() => void pickMedia("mouth_video")}
        pickLabel="Chọn video"
        role="mouth_video"
      />
      <MediaRoleRow
        disabled={isBusy}
        icon={<Volume2 color={colors.blue} size={20} />}
        label="Âm phát âm"
        media={resolved.byRole.pronunciation_audio}
        onDelete={() => confirmDelete("pronunciation_audio")}
        onRecord={() => {
          void (isRecordingAudio ? stopAudioRecording() : startAudioRecording());
        }}
        recordDisabled={isMutationBusy}
        recordIcon={
          isRecordingAudio ? (
            <Square color={colors.primary} size={22} />
          ) : (
            <Mic2 color={colors.primary} size={22} />
          )
        }
        recordLabel={
          isRecordingAudio
            ? `Dừng ${Math.round(audioRecorderState.durationMillis / 1000)}s`
            : "Thu âm"
        }
        role="pronunciation_audio"
      />
    </View>
  );
}

function MediaRoleRow({
  role,
  label,
  icon,
  media,
  pickLabel,
  disabled,
  onPick,
  onCapture,
  onRecord,
  onDelete,
  recordDisabled,
  recordIcon,
  recordLabel
}: {
  role: MediaRole;
  label: string;
  icon: ReactNode;
  media?: LearningItemMedia;
  pickLabel?: string;
  disabled?: boolean;
  onPick?: () => void;
  onCapture?: () => void;
  onRecord?: () => void;
  onDelete?: () => void;
  recordDisabled?: boolean;
  recordIcon?: ReactNode;
  recordLabel?: string;
}) {
  const isCustom = media?.asset.source === "custom";

  return (
    <Card style={styles.row} variant="input">
      <View style={styles.preview}>
        <MediaPlaceholder media={media} role={role} />
      </View>
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {icon}
          <AppText style={styles.label} variant="fieldLabel">
            {label}
          </AppText>
        </View>
        <AppText color="muted" variant="meta">
          {isCustom
            ? "Đang dùng media cá nhân"
            : media
              ? "Đang dùng media mặc định"
              : "Chưa có media"}
        </AppText>
        <View style={styles.actions}>
          {onPick && pickLabel ? (
            <KidButton disabled={disabled} label={pickLabel} onPress={onPick} variant="plain" />
          ) : null}
          {onCapture ? (
            <KidButton
              disabled={disabled}
              icon={<Camera color={colors.primary} size={22} />}
              label="Quay"
              onPress={onCapture}
              variant="plain"
            />
          ) : null}
          {onRecord && recordLabel ? (
            <KidButton
              disabled={recordDisabled}
              icon={recordIcon}
              label={recordLabel}
              onPress={onRecord}
              variant="plain"
            />
          ) : null}
          {isCustom && onDelete ? (
            <KidButton
              disabled={disabled}
              icon={<Trash2 color={colors.onPrimary} size={22} />}
              label="Xóa custom"
              onPress={onDelete}
              variant="danger"
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Vui lòng thử lại.";
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[14],
    paddingTop: spacing[4]
  },
  row: {
    gap: spacing[12]
  },
  preview: {
    width: "100%"
  },
  body: {
    gap: spacing[8],
    justifyContent: "center"
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8]
  },
  label: {
    flexShrink: 1
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8]
  }
});
