import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, Mic2, Square, Trash2, Video, Volume2 } from "lucide-react-native";
import { useEffect, type ReactNode } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { KidButton } from "@/components/KidButton";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItem, LearningItemMedia, MediaRole } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors } from "@/theme";

import { cleanupTempMediaImports } from "./mediaImportService";
import {
  useDeleteCustomMediaMutation,
  useSavePickedMediaMutation,
  useSaveRecordedAudioMutation
} from "./useMediaPersonalization";

export function PersonalizedMediaSection({ item }: { item: LearningItem }) {
  const resolved = resolveLearningItemMedia(item);
  const saveMediaMutation = useSavePickedMediaMutation(item.id);
  const saveAudioMutation = useSaveRecordedAudioMutation(item.id);
  const deleteMediaMutation = useDeleteCustomMediaMutation(item.id);
  const audioRecorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, directory: "cache" });
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const isRecordingAudio = audioRecorderState.isRecording;
  const isMutationBusy = saveMediaMutation.isPending || saveAudioMutation.isPending || deleteMediaMutation.isPending;
  const isBusy = isMutationBusy || isRecordingAudio;

  useEffect(() => {
    void cleanupTempMediaImports();
  }, []);

  useEffect(() => {
    return () => {
      if (audioRecorder.getStatus().isRecording) {
        void audioRecorder.stop();
      }
    };
  }, [audioRecorder]);

  async function pickMedia(role: MediaRole) {
    try {
      await ensureLibraryPermission();
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
      await ensureCameraPermission();
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
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Ứng dụng cần quyền micro để thu âm phát âm.");
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync({ ...RecordingPresets.LOW_QUALITY, directory: "cache" });
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
      <Text style={styles.heading}>Media cá nhân</Text>
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
        recordIcon={isRecordingAudio ? <Square color={colors.primary} size={22} /> : <Mic2 color={colors.primary} size={22} />}
        recordLabel={isRecordingAudio ? `Dừng ${Math.round(audioRecorderState.durationMillis / 1000)}s` : "Thu âm"}
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
    <View style={styles.row}>
      <View style={styles.preview}>
        <MediaPlaceholder media={media} role={role} />
      </View>
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.source}>{isCustom ? "Đang dùng media cá nhân" : media ? "Đang dùng media mặc định" : "Chưa có media"}</Text>
        <View style={styles.actions}>
          {onPick && pickLabel ? <KidButton disabled={disabled} label={pickLabel} onPress={onPick} variant="plain" /> : null}
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
              icon={<Trash2 color="#FFFFFF" size={22} />}
              label="Xóa custom"
              onPress={onDelete}
              variant="danger"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

async function ensureLibraryPermission(): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Ứng dụng cần quyền đọc thư viện ảnh/video để lưu media cá nhân.");
  }
}

async function ensureCameraPermission(): Promise<void> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Ứng dụng cần quyền camera để quay video khẩu hình.");
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Vui lòng thử lại.";
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 14
  },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  row: {
    alignItems: "stretch",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingTop: 12
  },
  preview: {
    width: 128
  },
  body: {
    flex: 1,
    gap: 8,
    justifyContent: "center"
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  label: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "900"
  },
  source: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
