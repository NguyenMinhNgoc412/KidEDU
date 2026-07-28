import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Camera,
  Image as ImageIcon,
  Mic2,
  Pause,
  Play,
  Save,
  Square,
  Trash2,
  Video,
  Volume2,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { MediaContainer } from "@/components/MediaContainer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { useKidEduRepository } from "@/data/KidEduDataProvider";
import type { LearningItem, LearningItemMedia, MediaRole } from "@/data/types";
import { resolveLearningItemMedia } from "@/features/media/mediaResolver";
import { colors, radii, spacing } from "@/theme";

import { cleanupOrphanedMediaFiles } from "./mediaCleanupService";
import {
  cleanupTempMediaImports,
  discardStagedMedia,
  stageImagePickerAssetForPreview,
  stageRecordedAudioForPreview,
  type StagedMediaImport
} from "./mediaImportService";
import { isLearningSessionActive } from "@/features/session/learningOperationCoordinator";
import {
  ensureAudioRecordingPermission,
  ensureMediaLibraryPermission,
  ensureMouthVideoCapturePermission
} from "./mediaPermissions";
import { cleanupPersonalizedMediaOnUnmount } from "./personalizedMediaLifecycle";
import {
  useDeleteCustomMediaMutation,
  useSaveStagedMediaMutation
} from "./useMediaPersonalization";
import { useDisplayMediaUri } from "./useDisplayMediaUri";

export function PersonalizedMediaSection({ item }: { item: LearningItem }) {
  const repository = useKidEduRepository();
  const resolved = resolveLearningItemMedia(item);
  const saveMediaMutation = useSaveStagedMediaMutation(item.id);
  const deleteMediaMutation = useDeleteCustomMediaMutation(item.id);
  const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const audioRecorderState = useAudioRecorderState(audioRecorder);
  const [stagingRole, setStagingRole] = useState<MediaRole | null>(null);
  const [stagedByRole, setStagedByRole] = useState<Partial<Record<MediaRole, StagedMediaImport>>>(
    {}
  );
  const stagedByRoleRef = useRef(stagedByRole);
  const isMountedRef = useRef(true);
  const isRecordingAudio = audioRecorderState.isRecording;
  const isMutationBusy = saveMediaMutation.isPending || deleteMediaMutation.isPending;
  const isBusy = isMutationBusy || isRecordingAudio || stagingRole !== null;
  const hasStagedMedia = Object.keys(stagedByRole).length > 0;

  useEffect(() => {
    if (!isLearningSessionActive()) {
      void cleanupTempMediaImports();
    }
    void cleanupOrphanedMediaFiles(repository, {
      isPlaybackActive: isLearningSessionActive
    });
  }, [repository]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      cleanupPersonalizedMediaOnUnmount({
        discardStagedMedia,
        markUnmounted: () => {
          isMountedRef.current = false;
        },
        resetAudioMode: resetAudioRecordingMode,
        stagedMedia: Object.values(stagedByRoleRef.current)
      });
    };
  }, []);

  function updateStagedMedia(role: MediaRole, staged?: StagedMediaImport) {
    const next = { ...stagedByRoleRef.current };
    if (staged) {
      next[role] = staged;
    } else {
      delete next[role];
    }
    stagedByRoleRef.current = next;
    setStagedByRole(next);
  }

  async function replaceStagedMedia(role: MediaRole, create: () => Promise<StagedMediaImport>) {
    setStagingRole(role);
    try {
      const staged = await create();
      if (!isMountedRef.current) {
        await discardStagedMedia(staged);
        return;
      }

      const previous = stagedByRoleRef.current[role];
      updateStagedMedia(role, staged);
      await discardStagedMedia(previous);
    } finally {
      if (isMountedRef.current) {
        setStagingRole(null);
      }
    }
  }

  async function pickMedia(role: MediaRole) {
    try {
      await ensureMediaLibraryPermission();
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: role === "illustration",
        allowsMultipleSelection: false,
        aspect: role === "illustration" ? [4, 3] : undefined,
        base64: false,
        mediaTypes: role === "illustration" ? ["images"] : ["videos"],
        quality: role === "illustration" ? 0.82 : 1,
        selectionLimit: 1,
        videoExportPreset:
          role === "mouth_video" ? ImagePicker.VideoExportPreset.Passthrough : undefined,
        videoMaxDuration: 15
      });

      if (result.canceled) {
        return;
      }

      const [asset] = result.assets;
      if (!asset) {
        return;
      }

      await replaceStagedMedia(role, () => stageImagePickerAssetForPreview(asset, role));
    } catch (error) {
      Alert.alert("Chưa tạo được bản xem trước", getErrorMessage(error));
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
        quality: 1,
        videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
        videoMaxDuration: 15,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High
      });

      if (result.canceled) {
        return;
      }

      const [asset] = result.assets;
      if (!asset) {
        return;
      }

      await replaceStagedMedia("mouth_video", () =>
        stageImagePickerAssetForPreview(asset, "mouth_video")
      );
    } catch (error) {
      Alert.alert("Chưa tạo được bản xem trước", getErrorMessage(error));
    }
  }

  async function startAudioRecording() {
    try {
      await ensureAudioRecordingPermission();
      if (!isMountedRef.current) {
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!isMountedRef.current) {
        await resetAudioRecordingMode();
        return;
      }

      await audioRecorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
      if (!isMountedRef.current) {
        await resetAudioRecordingMode();
        return;
      }

      audioRecorder.record();
    } catch (error) {
      void resetAudioRecordingMode();
      if (isMountedRef.current) {
        Alert.alert("Chưa thu âm được", getErrorMessage(error));
      }
    }
  }

  async function stopAudioRecording() {
    try {
      await audioRecorder.stop();
      if (!isMountedRef.current) {
        return;
      }

      const status = audioRecorder.getStatus();
      const uri = status.url ?? audioRecorder.uri;

      if (!uri) {
        throw new Error("Không tìm thấy tệp thu âm.");
      }

      await replaceStagedMedia("pronunciation_audio", () =>
        stageRecordedAudioForPreview({
          durationMs: status.durationMillis,
          mimeType: uri.endsWith(".webm") ? "audio/webm" : "audio/m4a",
          uri
        })
      );
    } catch (error) {
      if (isMountedRef.current) {
        Alert.alert("Chưa dừng được thu âm", getErrorMessage(error));
      }
    } finally {
      void resetAudioRecordingMode();
    }
  }

  function saveStaged(role: MediaRole) {
    const staged = stagedByRoleRef.current[role];
    if (!staged) {
      return;
    }

    updateStagedMedia(role);
    saveMediaMutation.mutate(staged, {
      onError: (error) => Alert.alert("Chưa lưu được media", getErrorMessage(error))
    });
  }

  function cancelStaged(role: MediaRole) {
    const staged = stagedByRoleRef.current[role];
    updateStagedMedia(role);
    void discardStagedMedia(staged);
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

  function isRoleDisabled(role: MediaRole): boolean {
    return isBusy || (hasStagedMedia && !stagedByRole[role]);
  }

  return (
    <View style={styles.container}>
      <AppText variant="cardTitle">Media cá nhân</AppText>
      <MediaRoleRow
        disabled={isRoleDisabled("illustration")}
        icon={<ImageIcon color={colors.primary} size={26} />}
        label="Ảnh minh họa"
        media={resolved.byRole.illustration}
        staged={stagedByRole.illustration}
        staging={stagingRole === "illustration"}
        onCancelStaged={() => cancelStaged("illustration")}
        onDelete={() => confirmDelete("illustration")}
        onPick={() => void pickMedia("illustration")}
        onSaveStaged={() => saveStaged("illustration")}
        pickLabel="Chọn ảnh"
        role="illustration"
      />
      <MediaRoleRow
        disabled={isRoleDisabled("mouth_video")}
        icon={<Video color={colors.coral} size={26} />}
        label="Video khẩu hình"
        media={resolved.byRole.mouth_video}
        staged={stagedByRole.mouth_video}
        staging={stagingRole === "mouth_video"}
        onCancelStaged={() => cancelStaged("mouth_video")}
        onCapture={captureVideo}
        onDelete={() => confirmDelete("mouth_video")}
        onPick={() => void pickMedia("mouth_video")}
        onSaveStaged={() => saveStaged("mouth_video")}
        pickLabel="Chọn video"
        role="mouth_video"
      />
      <MediaRoleRow
        disabled={isRoleDisabled("pronunciation_audio")}
        icon={<Volume2 color={colors.blue} size={26} />}
        label="Âm phát âm"
        media={resolved.byRole.pronunciation_audio}
        staged={stagedByRole.pronunciation_audio}
        staging={stagingRole === "pronunciation_audio"}
        onCancelStaged={() => cancelStaged("pronunciation_audio")}
        onDelete={() => confirmDelete("pronunciation_audio")}
        onRecord={() => {
          void (isRecordingAudio ? stopAudioRecording() : startAudioRecording());
        }}
        recordDisabled={
          isMutationBusy ||
          stagingRole !== null ||
          (hasStagedMedia && !stagedByRole.pronunciation_audio)
        }
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
        onSaveStaged={() => saveStaged("pronunciation_audio")}
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
  staged,
  staging,
  pickLabel,
  disabled,
  onPick,
  onCapture,
  onRecord,
  onDelete,
  onSaveStaged,
  onCancelStaged,
  recordDisabled,
  recordIcon,
  recordLabel
}: {
  role: MediaRole;
  label: string;
  icon: ReactNode;
  media?: LearningItemMedia;
  staged?: StagedMediaImport;
  staging?: boolean;
  pickLabel?: string;
  disabled?: boolean;
  onPick?: () => void;
  onCapture?: () => void;
  onRecord?: () => void;
  onDelete?: () => void;
  onSaveStaged?: () => void;
  onCancelStaged?: () => void;
  recordDisabled?: boolean;
  recordIcon?: ReactNode;
  recordLabel?: string;
}) {
  const isCustom = media?.asset.source === "custom";
  const hint = mediaHintByRole[role];

  return (
    <Card style={styles.row} variant="input">
      <View style={styles.preview}>
        {staged ? (
          <StagedMediaPreview staged={staged} />
        ) : (
          <MediaPlaceholder large={role !== "pronunciation_audio"} media={media} role={role} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {icon}
          <AppText style={styles.label} variant="fieldLabel">
            {label}
          </AppText>
        </View>
        <AppText color="muted" variant="meta">
          {staging
            ? "Đang chuẩn bị bản xem trước…"
            : staged
              ? "Bản xem trước — chưa thay media đang dùng"
              : isCustom
                ? "Đang dùng media cá nhân"
                : media
                  ? "Đang dùng media mặc định"
                  : "Chưa có media"}
        </AppText>
        <AppText align="center" color="muted" variant="caption">
          {hint}
        </AppText>
        <View style={styles.actions}>
          {staged && onSaveStaged && onCancelStaged ? (
            <>
              <KidButton
                disabled={disabled}
                icon={<Save color={colors.onPrimary} size={22} />}
                label="Lưu media"
                onPress={onSaveStaged}
              />
              <KidButton
                disabled={disabled}
                icon={<X color={colors.primary} size={22} />}
                label="Hủy"
                onPress={onCancelStaged}
                variant="plain"
              />
            </>
          ) : null}
          {!staged && onPick && pickLabel ? (
            <KidButton disabled={disabled} label={pickLabel} onPress={onPick} variant="plain" />
          ) : null}
          {!staged && onCapture ? (
            <KidButton
              disabled={disabled}
              icon={<Camera color={colors.primary} size={22} />}
              label="Quay"
              onPress={onCapture}
              variant="plain"
            />
          ) : null}
          {!staged && onRecord && recordLabel ? (
            <KidButton
              disabled={recordDisabled}
              icon={recordIcon}
              label={recordLabel}
              onPress={onRecord}
              variant="plain"
            />
          ) : null}
          {!staged && isCustom && onDelete ? (
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

function StagedMediaPreview({ staged }: { staged: StagedMediaImport }) {
  const displayUri = useDisplayMediaUri(staged.uri);

  if (!displayUri) {
    return <MediaContainer size={staged.type === "audio" ? "default" : "large"} />;
  }

  if (staged.type === "video") {
    return <StagedVideoPreview uri={displayUri} />;
  }

  if (staged.type === "audio") {
    return <StagedAudioPreview durationMs={staged.durationMs} uri={displayUri} />;
  }

  return <MediaContainer size="large" uri={displayUri} />;
}

function StagedVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.staysActiveInBackground = false;
    videoPlayer.audioMixingMode = "doNotMix";
  });

  return (
    <MediaContainer size="large" style={styles.videoPreview}>
      <VideoView
        contentFit="cover"
        nativeControls
        player={player}
        playsInline
        style={styles.video}
      />
    </MediaContainer>
  );
}

function StagedAudioPreview({ uri, durationMs }: { uri: string; durationMs: number | null }) {
  const source = useMemo(() => ({ uri }), [uri]);
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // Expo can release the player before React cleanup completes.
      }
    };
  }, [player]);

  function togglePlayback() {
    if (status.playing) {
      player.pause();
      return;
    }

    void player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => player.play());
  }

  return (
    <MediaContainer style={styles.audioPreview}>
      <Volume2 color={colors.blue} size={38} />
      <AppText align="center" variant="labelStrong">
        Nghe lại bản thu
      </AppText>
      <AppText align="center" color="muted" variant="caption">
        {durationMs ? `${Math.max(1, Math.round(durationMs / 1000))} giây` : "Bản thu mới"}
      </AppText>
      <KidButton
        icon={
          status.playing ? (
            <Pause color={colors.onPrimary} size={22} />
          ) : (
            <Play color={colors.onPrimary} size={22} />
          )
        }
        label={status.playing ? "Tạm dừng" : "Phát thử"}
        onPress={togglePlayback}
        size="sm"
      />
    </MediaContainer>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Vui lòng thử lại.";
}

async function resetAudioRecordingMode(): Promise<void> {
  try {
    await setAudioModeAsync({ allowsRecording: false });
  } catch {
    // Audio mode reset is best effort during screen unmount or native teardown.
  }
}

const mediaHintByRole: Record<MediaRole, string> = {
  illustration: "Chọn ảnh rõ một chủ thể, JPG hoặc PNG.",
  mouth_video: "Video HD 720p trở lên, rõ miệng, tối đa khoảng 15 giây.",
  pronunciation_audio: "Thu âm giọng rõ, ngắn, không có nhạc nền.",
  sfx: "Âm thanh minh họa ngắn và nhẹ."
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[14],
    paddingTop: spacing[4]
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceInput,
    borderColor: colors.sage,
    borderRadius: radii.lg,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing[12],
    padding: spacing[14]
  },
  preview: {
    alignSelf: "stretch",
    width: "100%"
  },
  videoPreview: {
    padding: spacing.none
  },
  video: {
    height: "100%",
    width: "100%"
  },
  audioPreview: {
    aspectRatio: 1.8,
    minHeight: 160
  },
  body: {
    alignItems: "center",
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
    gap: spacing[8],
    justifyContent: "center"
  }
});
