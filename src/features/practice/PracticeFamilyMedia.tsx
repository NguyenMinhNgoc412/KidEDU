import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import { useQueryClient } from "@tanstack/react-query";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLessonRuntimeRepository } from "@/features/lessonRuntime/LessonRuntimeProvider";
import { findSampleLesson } from "@/features/lessonRuntime/lessonCatalog";
import { buildMediaSampleGraph } from "@/features/lessonRuntime/mediaSampleLessons";
import { validatePublishedLessonGraph } from "@/content/contracts/validateLessonGraph";
import {
  ensureAudioRecordingPermission,
  ensureMediaLibraryPermission
} from "@/features/media/mediaPermissions";
import {
  cleanupMediaFiles,
  commitStagedMediaToAppStorage,
  discardStagedMedia,
  stageImagePickerAssetForPreview,
  stageRecordedAudioForPreview,
  type StagedMediaImport
} from "@/features/media/mediaImportService";
import { MediaActivityStage } from "./MediaActivityStage";
import { preparePracticeSample } from "./preparePracticeSample";
import type { LocalActivityAssets } from "./activityMedia";
import { exportPracticeMedia } from "./exportPracticeMedia";
let recordingOwner: object | null = null;

/** Parent-only editor; child/target/type/role bindings never replace an active prepared snapshot. */
export function PracticeFamilyMedia({ childId, lessonId }: { childId: string; lessonId: string }) {
  const { session } = useAuth();
  const { repository } = useLessonRuntimeRepository();
  const queryClient = useQueryClient();
  const sample = findSampleLesson(lessonId);
  const graph =
    sample && "activityType" in sample
      ? validatePublishedLessonGraph(buildMediaSampleGraph(sample))
      : null;
  const activity = graph?.ok ? graph.activities[0] : null;
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recording = useAudioRecorderState(recorder);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [media, setMedia] = useState<LocalActivityAssets>({});
  const [staged, setStaged] = useState<{ id: string; value: StagedMediaImport } | null>(null);
  const stagedRef = useRef(staged);
  const mounted = useRef(true);
  const recordingRole = useRef<string | null>(null);
  const previewAccount = session?.accountId;
  function replaceStaged(next: typeof staged) {
    const previous = stagedRef.current;
    stagedRef.current = next;
    setStaged(next);
    setPreviewFailed(false);
    void discardStagedMedia(previous?.value);
  }
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active" && recorder.isRecording) {
        recordingRole.current = null;
        if (recordingOwner === recorder) recordingOwner = null;
        void recorder
          .stop()
          .finally(() => setAudioModeAsync({ allowsRecording: false }))
          .catch(() => undefined);
      }
    });
    return () => {
      mounted.current = false;
      listener.remove();
      void discardStagedMedia(stagedRef.current?.value);
      if (recordingOwner === recorder) {
        recordingOwner = null;
        if (recorder.isRecording) void recorder.stop().catch(() => undefined);
        void setAudioModeAsync({ allowsRecording: false });
      }
    };
  }, [recorder]);
  useEffect(() => {
    let active = true;
    if (expanded && previewAccount && repository) {
      void preparePracticeSample(previewAccount, childId, lessonId, repository)
        .then((prepared) => {
          if (active) setMedia(prepared.media ?? {});
        })
        .catch(() => {
          if (active) setMessage("Chưa đọc được media. Hãy đóng rồi mở lại.");
        });
    }
    return () => {
      active = false;
    };
  }, [expanded, previewAccount, childId, lessonId, repository]);
  if (!activity || !previewAccount || !repository) return null;
  const selectedRef = activity.assets.required.find((ref) => ref.assetId === staged?.id);
  const preview =
    staged && selectedRef
      ? {
          ...media,
          [staged.id]: {
            uri: staged.value.uri,
            type: staged.value.type as "image" | "audio" | "video",
            mimeType: staged.value.mimeType ?? "",
            accountId: previewAccount,
            childId,
            role: selectedRef.role
          }
        }
      : media;
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } catch {
      if (recordingOwner === recorder && !recorder.isRecording) {
        recordingOwner = null;
        void setAudioModeAsync({ allowsRecording: false });
      }
      if (mounted.current)
        setMessage("Chưa lưu được thay đổi. Media cũ vẫn được giữ; bạn có thể thử lại.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function choose(id: string, video: boolean) {
    await ensureMediaLibraryPermission();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: video ? ["videos"] : ["images"],
      base64: false,
      allowsMultipleSelection: false,
      quality: 0.82,
      videoMaxDuration: 15
    });
    if (result.canceled || !result.assets[0]) return;
    const value = await stageImagePickerAssetForPreview(
      result.assets[0],
      video ? "mouth_video" : "illustration"
    );
    if (!mounted.current) {
      await discardStagedMedia(value);
      return;
    }
    replaceStaged({ id, value });
  }
  async function record(id: string) {
    if (recordingRole.current) {
      const durationMs = recorder.getStatus().durationMillis;
      if (recorder.isRecording) await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recordingOwner === recorder) recordingOwner = null;
      const uri = recorder.uri;
      if (!uri || !recordingRole.current) return;
      const value = await stageRecordedAudioForPreview({
        uri,
        durationMs,
        mimeType: uri.endsWith(".webm") ? "audio/webm" : "audio/m4a"
      });
      if (!mounted.current) {
        await discardStagedMedia(value);
        return;
      }
      replaceStaged({ id: recordingRole.current, value });
      recordingRole.current = null;
    } else {
      if (recordingOwner && recordingOwner !== recorder) throw new Error("RECORDING_IN_PROGRESS");
      recordingOwner = recorder;
      await ensureAudioRecordingPermission();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!mounted.current) {
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      recordingRole.current = id;
      recorder.record({ forDuration: 15 });
    }
  }
  async function save() {
    if (!staged || !selectedRef || !activity || !repository || previewFailed) return;
    const saved = await commitStagedMediaToAppStorage(staged.value, previewAccount, "practice");
    const asset = {
      uri: saved.uri,
      type: saved.type as "image" | "audio" | "video",
      mimeType: saved.mimeType ?? "",
      accountId: previewAccount!,
      childId,
      role: selectedRef.role
    };
    try {
      const previous = await repository.setPracticeMedia(
        childId,
        lessonId,
        activity.targetIds[0]!,
        activity.type,
        staged.id,
        asset
      );
      if (previous && (await repository.canRemovePracticeMedia(previous.uri)))
        await cleanupMediaFiles([previous.uri]);
      await cleanupMediaFiles([saved.thumbnailUri]);
    } catch (error) {
      await cleanupMediaFiles([saved.uri, saved.thumbnailUri]);
      throw error;
    }
    setMedia((current) => ({ ...current, [staged.id]: asset }));
    replaceStaged(null);
    await queryClient.invalidateQueries({
      queryKey: ["practice-preparation", previewAccount, childId, lessonId]
    });
    setMessage("Đã lưu cho buổi mới. Buổi đang dở giữ media đã chuẩn bị.");
  }
  return (
    <View style={{ gap: 12 }}>
      <KidButton
        label={expanded ? "Đóng media gia đình" : `Media gia đình cho ${sample!.title}`}
        variant="plain"
        disabled={busy || recording.isRecording}
        onPress={() => setExpanded(!expanded)}
      />
      {expanded ? (
        <Card variant="subtle">
          <AppText variant="cardTitle">Hình và giọng nói quen thuộc</AppText>
          <AppText>
            Chỉ lưu trên thiết bị cho hồ sơ này. Xem trước rồi xác nhận. Đọc đúng lời của vai trò âm
            thanh; không dùng âm mẫu hoàn chỉnh thay đoạn vuốt đuôi.
          </AppText>
          {activity.assets.required.map((ref, index) => {
            const label =
              ref.role === "mouth_video"
                ? "Khẩu hình"
                : ref.role === "semantic_visual"
                  ? `Ảnh lựa chọn ${index + 1}`
                  : ref.role === "context_visual"
                    ? "Ảnh tình huống"
                    : ref.role === "instruction_audio"
                      ? "Lời yêu cầu"
                      : ref.role === "prompt_audio"
                        ? "Âm gợi ý"
                        : ref.role === "segment_audio"
                          ? index === 0
                            ? "Đoạn mở đầu"
                            : "Câu đầy đủ"
                          : "Âm mẫu";
            return (
              <View key={ref.assetId} style={{ gap: 8 }}>
                <AppText>{label}</AppText>
                <KidButton
                  variant="secondary"
                  disabled={
                    busy || (recording.isRecording && recordingRole.current !== ref.assetId)
                  }
                  label={
                    ref.role.endsWith("audio")
                      ? recordingRole.current === ref.assetId
                        ? "Dừng và xem trước thu âm"
                        : `Thu âm ${label.toLowerCase()}`
                      : `Chọn ${label.toLowerCase()}`
                  }
                  onPress={() =>
                    void run(() =>
                      ref.role.endsWith("audio")
                        ? record(ref.assetId)
                        : choose(ref.assetId, ref.role === "mouth_video")
                    )
                  }
                />
                <KidButton
                  variant="plain"
                  label={`Dùng lại mẫu ${label.toLowerCase()}`}
                  disabled={busy || recording.isRecording}
                  onPress={() =>
                    void run(async () => {
                      const previous = await repository.setPracticeMedia(
                        childId,
                        lessonId,
                        activity.targetIds[0]!,
                        activity.type,
                        ref.assetId,
                        null
                      );
                      if (previous && (await repository.canRemovePracticeMedia(previous.uri)))
                        await cleanupMediaFiles([previous.uri]);
                      replaceStaged(null);
                      const prepared = await preparePracticeSample(
                        previewAccount,
                        childId,
                        lessonId,
                        repository
                      );
                      setMedia(prepared.media ?? {});
                      await queryClient.invalidateQueries({ queryKey: ["practice-preparation"] });
                      setMessage("Buổi mới sẽ dùng mẫu mặc định cho vai trò này.");
                    })
                  }
                />
                <KidButton
                  variant="plain"
                  label={`Xuất bản gia đình ${label.toLowerCase()}`}
                  disabled={busy || recording.isRecording}
                  onPress={() =>
                    void run(async () => {
                      const bindings = await repository.practiceMedia(
                        childId,
                        lessonId,
                        activity.targetIds[0]!,
                        activity.type
                      );
                      const asset = bindings[ref.assetId];
                      if (!asset) {
                        setMessage(
                          "Vai trò này đang dùng mẫu mặc định, chưa có bản gia đình để xuất."
                        );
                        return;
                      }
                      await exportPracticeMedia(asset, previewAccount, childId);
                    })
                  }
                />
              </View>
            );
          })}
          {staged ? (
            <>
              <AppText variant="labelStrong">Xem trước bản thay thế</AppText>
              <MediaActivityStage
                activity={activity}
                media={preview}
                childId={childId}
                seed="parent-preview"
                promptLevel={
                  activity.type === "cloze_tail" &&
                  staged.id === activity.stimulus.leadInAudioAssetId
                    ? 0
                    : activity.promptLadder.length - 1
                }
                repeats={0}
                presenting={false}
                paused={busy || recording.isRecording}
                onSampleEnd={() => undefined}
                onError={() => {
                  setPreviewFailed(true);
                  setMessage("Media chưa phát được. Hãy chọn lại trước khi lưu.");
                }}
              />

              <KidButton
                label="Xác nhận dùng media này"
                disabled={busy || recording.isRecording || previewFailed}
                onPress={() => void run(save)}
              />
              <KidButton
                label="Hủy bản xem trước"
                variant="plain"
                disabled={busy}
                onPress={() => replaceStaged(null)}
              />
            </>
          ) : null}
          {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
        </Card>
      ) : null}
    </View>
  );
}
