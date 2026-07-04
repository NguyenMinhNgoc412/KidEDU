import { useEventListener } from "expo";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play, Volume2 } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItemMedia, PlaybackSpeed } from "@/data/types";
import {
  resolveLearningMediaStageRole,
  type ActiveLearningMediaRole
} from "@/features/learning/learningMediaStage";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import { colors, radii } from "@/theme";

export function LearningMediaPlayer({
  illustration,
  mouthVideo,
  pronunciationAudio,
  autoPlayKey,
  onAutoPlaySampleEnd,
  paused = false,
  playbackSpeed = 1
}: {
  illustration?: LearningItemMedia;
  mouthVideo?: LearningItemMedia;
  pronunciationAudio?: LearningItemMedia;
  autoPlayKey?: string | null;
  onAutoPlaySampleEnd?: () => void;
  paused?: boolean;
  playbackSpeed?: PlaybackSpeed;
}) {
  const illustrationUri = useDisplayMediaUri(illustration?.asset.uri ?? null);
  const videoUri = useDisplayMediaUri(mouthVideo?.asset.uri ?? null);
  const audioUri = useDisplayMediaUri(pronunciationAudio?.asset.uri ?? null);
  const [activeRole, setActiveRole] = useState<ActiveLearningMediaRole>(illustration ? "illustration" : "mouth_video");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPlayOverlayVisible, setPlayOverlayVisible] = useState(Boolean(mouthVideo));
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoPlayKeyRef = useRef<string | null>(null);
  const completedAutoPlayKeyRef = useRef<string | null>(null);
  const audioCompletionAutoPlayKeyRef = useRef<string | null>(null);
  const shouldPlayFollowUpAudioRef = useRef(false);
  const wasPausedRef = useRef(paused);

  const playableVideoUri = isPlayableMediaUri(videoUri) ? videoUri : null;
  const playableAudioUri = isPlayableMediaUri(audioUri) ? audioUri : null;
  const mediaPlaybackIdentity = useMemo(
    () => (autoPlayKey ? `${autoPlayKey}:${playableVideoUri ?? ""}:${playableAudioUri ?? ""}:${playbackSpeed}` : null),
    [autoPlayKey, playableAudioUri, playableVideoUri, playbackSpeed]
  );
  const audioSource = useMemo(() => (playableAudioUri ? { uri: playableAudioUri } : null), [playableAudioUri]);
  const videoSource = useMemo(() => (playableVideoUri ? { uri: playableVideoUri } : null), [playableVideoUri]);

  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
    player.audioMixingMode = "doNotMix";
  });
  const audioPlayer = useAudioPlayer(audioSource, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    videoPlayer.playbackRate = playbackSpeed;
    audioPlayer.playbackRate = playbackSpeed;
  }, [audioPlayer, playbackSpeed, videoPlayer]);

  const clearOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
  }, []);

  const showPlayOverlay = useCallback(() => {
    setPlayOverlayVisible(true);
    clearOverlayTimer();
    overlayTimerRef.current = setTimeout(() => {
      setPlayOverlayVisible(false);
      overlayTimerRef.current = null;
    }, 1000);
  }, [clearOverlayTimer]);

  const completeAutoPlaySample = useCallback(() => {
    if (!autoPlayKey || paused || completedAutoPlayKeyRef.current === autoPlayKey) {
      return;
    }

    completedAutoPlayKeyRef.current = autoPlayKey;
    audioCompletionAutoPlayKeyRef.current = null;
    shouldPlayFollowUpAudioRef.current = false;
    onAutoPlaySampleEnd?.();
  }, [autoPlayKey, onAutoPlaySampleEnd, paused]);

  const pauseAll = useCallback(() => {
    shouldPlayFollowUpAudioRef.current = false;
    videoPlayer.pause();
    audioPlayer.pause();
  }, [audioPlayer, videoPlayer]);

  const restartVideo = useCallback(() => {
    videoPlayer.pause();
    try {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    } catch {
      videoPlayer.replay();
      videoPlayer.play();
    }
  }, [videoPlayer]);

  const playAudio = useCallback((options?: { completeAutoPlaySampleOnEnd?: boolean }) => {
    shouldPlayFollowUpAudioRef.current = false;
    if (!playableAudioUri) {
      setActiveRole("pronunciation_audio");
      setFeedback("Chưa có âm phát âm để phát.");
      return;
    }

    videoPlayer.pause();
    setActiveRole("pronunciation_audio");
    setFeedback(null);
    audioCompletionAutoPlayKeyRef.current =
      options?.completeAutoPlaySampleOnEnd && autoPlayKey ? autoPlayKey : null;
    void audioPlayer.seekTo(0).finally(() => audioPlayer.play());
  }, [audioPlayer, autoPlayKey, playableAudioUri, videoPlayer]);

  const playMouthVideo = useCallback(() => {
    shouldPlayFollowUpAudioRef.current = false;
    if (!playableVideoUri) {
      setActiveRole("mouth_video");
      setFeedback("Chưa có video khẩu hình để phát.");
      return;
    }

    audioPlayer.pause();
    setActiveRole("mouth_video");
    setFeedback(null);
    showPlayOverlay();
    restartVideo();
  }, [audioPlayer, playableVideoUri, restartVideo, showPlayOverlay]);

  const playQueuedFollowUpAudio = useCallback(() => {
    if (!shouldPlayFollowUpAudioRef.current || !playableAudioUri || paused) {
      return;
    }

    playAudio({ completeAutoPlaySampleOnEnd: true });
  }, [paused, playableAudioUri, playAudio]);

  useEventListener(videoPlayer, "playToEnd", () => {
    if (shouldPlayFollowUpAudioRef.current && playableAudioUri) {
      playQueuedFollowUpAudio();
      return;
    }

    completeAutoPlaySample();
  });

  const playSample = useCallback(() => {
    if (playableVideoUri) {
      shouldPlayFollowUpAudioRef.current = Boolean(playableAudioUri);
      audioPlayer.pause();
      setActiveRole("mouth_video");
      setFeedback(null);
      showPlayOverlay();
      restartVideo();
      return;
    }

    if (playableAudioUri) {
      playAudio({ completeAutoPlaySampleOnEnd: true });
      return;
    }

    setFeedback("Thẻ này chưa có video hoặc âm phát âm có thể phát.");
  }, [
    audioPlayer,
    playableAudioUri,
    playableVideoUri,
    playAudio,
    restartVideo,
    showPlayOverlay
  ]);

  useEffect(() => {
    if (!audioStatus.didJustFinish || audioCompletionAutoPlayKeyRef.current !== autoPlayKey) {
      return;
    }

    completeAutoPlaySample();
  }, [audioStatus.didJustFinish, autoPlayKey, completeAutoPlaySample]);

  useEffect(() => {
    const wasPaused = wasPausedRef.current;
    wasPausedRef.current = paused;

    if (
      !wasPaused ||
      paused ||
      !autoPlayKey ||
      !mediaPlaybackIdentity ||
      lastAutoPlayKeyRef.current !== mediaPlaybackIdentity ||
      completedAutoPlayKeyRef.current === autoPlayKey
    ) {
      return;
    }

    playSample();
  }, [autoPlayKey, mediaPlaybackIdentity, paused, playSample]);

  useEffect(() => {
    if (playableVideoUri) {
      showPlayOverlay();
      return;
    }

    setPlayOverlayVisible(false);
    clearOverlayTimer();
  }, [clearOverlayTimer, playableVideoUri, showPlayOverlay]);

  useEffect(() => {
    if (paused) {
      pauseAll();
    }
  }, [pauseAll, paused]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        pauseAll();
      }
    });

    return () => subscription.remove();
  }, [pauseAll]);

  useEffect(() => {
    return () => {
      pauseAll();
      clearOverlayTimer();
    };
  }, [clearOverlayTimer, pauseAll]);

  useEffect(() => {
    if (!autoPlayKey || paused) {
      return;
    }

    if (!mediaPlaybackIdentity || lastAutoPlayKeyRef.current === mediaPlaybackIdentity) {
      return;
    }

    lastAutoPlayKeyRef.current = mediaPlaybackIdentity;
    playSample();
  }, [autoPlayKey, mediaPlaybackIdentity, paused, playSample]);

  const hasRenderableIllustration = Boolean(illustrationUri && !illustrationUri.startsWith("seed://"));
  const stageRole = resolveLearningMediaStageRole({
    activeRole,
    hasRenderableIllustration,
    hasPlayableVideo: Boolean(playableVideoUri)
  });

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {stageRole === "mouth_video" && playableVideoUri ? (
          <View style={styles.videoPressable}>
            <VideoView
              contentFit="cover"
              nativeControls={false}
              player={videoPlayer}
              playsInline
              style={styles.video}
            />
            <Pressable
              accessibilityLabel={isPlayOverlayVisible ? "Phát khẩu hình" : "Hiện nút phát khẩu hình"}
              accessibilityRole="button"
              onPress={isPlayOverlayVisible ? playMouthVideo : showPlayOverlay}
              style={styles.videoTapLayer}
            >
              {isPlayOverlayVisible ? (
                <View style={styles.playOverlay}>
                  <Play color="#FFFFFF" fill="rgba(255,255,255,0.9)" size={30} />
                </View>
              ) : null}
            </Pressable>
          </View>
        ) : (
          <View style={styles.illustrationStage}>
            <MediaPlaceholder large media={illustration} role="illustration" />
            {activeRole === "pronunciation_audio" && playableAudioUri ? (
              <Pressable
                accessibilityLabel={audioStatus.playing ? "Đang phát âm mẫu" : "Phát âm phát âm"}
                accessibilityRole="button"
                onPress={() => playAudio()}
                style={({ pressed }) => [styles.audioOverlay, pressed ? styles.pressed : null]}
              >
                <Volume2 color="#FFFFFF" size={26} />
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.mediaChips}>
        <MediaChip
          active={activeRole === "mouth_video"}
          available={Boolean(playableVideoUri)}
          icon={<Play color={activeRole === "mouth_video" ? "#FFFFFF" : colors.muted} size={17} />}
          label="Khẩu hình"
          onPress={playMouthVideo}
        />
        <MediaChip
          active={activeRole === "pronunciation_audio"}
          available={Boolean(playableAudioUri)}
          icon={<Volume2 color={activeRole === "pronunciation_audio" ? "#FFFFFF" : colors.muted} size={17} />}
          label="Âm phát âm"
          onPress={() => playAudio()}
        />
      </View>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}

function MediaChip({
  active,
  available,
  icon,
  label,
  onPress
}: {
  active: boolean;
  available: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mediaChip,
        active ? styles.mediaChipActive : null,
        !available ? styles.mediaChipUnavailable : null,
        pressed ? styles.pressed : null
      ]}
    >
      {icon}
      <Text style={[styles.mediaChipText, active ? styles.mediaChipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function isPlayableMediaUri(uri: string | null): uri is string {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  stage: {
    overflow: "hidden"
  },
  videoPressable: {
    aspectRatio: 1.15,
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: 230,
    overflow: "hidden"
  },
  video: {
    height: "100%",
    width: "100%"
  },
  illustrationStage: {
    position: "relative"
  },
  videoTapLayer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  playOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(125, 86, 45, 0.58)",
    borderRadius: radii.full,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  audioOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(125, 86, 45, 0.74)",
    borderRadius: radii.full,
    bottom: 14,
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 52
  },
  mediaChips: {
    flexDirection: "row",
    gap: 12
  },
  mediaChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12
  },
  mediaChipActive: {
    backgroundColor: colors.coral
  },
  mediaChipUnavailable: {
    opacity: 0.72
  },
  mediaChipText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  mediaChipTextActive: {
    color: "#FFFFFF"
  },
  feedback: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82
  }
});
