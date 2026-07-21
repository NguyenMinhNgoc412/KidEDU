import { useEventListener } from "expo";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play, Volume2 } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { MediaContainer } from "@/components/MediaContainer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItemMedia, PlaybackSpeed } from "@/data/types";
import {
  getLearningVisualPlaceholderLabel,
  resolveLearningMediaStageRole,
  type ActiveLearningMediaRole
} from "@/features/learning/learningMediaStage";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import { colors, radii, spacing } from "@/theme";

interface MouthVideoPlayerHandle {
  pause(): void;
}

export type LearningSampleCompletion = "played" | "unavailable";

const audioLoadTimeoutMs = 4_000;

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
  onAutoPlaySampleEnd?: (completion: LearningSampleCompletion) => void;
  paused?: boolean;
  playbackSpeed?: PlaybackSpeed;
}) {
  const illustrationUri = useDisplayMediaUri(illustration?.asset.uri ?? null);
  const videoUri = useDisplayMediaUri(mouthVideo?.asset.uri ?? null);
  const audioUri = useDisplayMediaUri(pronunciationAudio?.asset.uri ?? null);
  const [activeRole, setActiveRole] = useState<ActiveLearningMediaRole>(
    illustration ? "illustration" : "mouth_video"
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [videoPlaySignal, setVideoPlaySignal] = useState(0);
  const mouthVideoPlayerRef = useRef<MouthVideoPlayerHandle | null>(null);
  const lastAutoPlayKeyRef = useRef<string | null>(null);
  const completedAutoPlayKeyRef = useRef<string | null>(null);
  const audioCompletionAutoPlayKeyRef = useRef<string | null>(null);
  const audioPlaybackRequestRef = useRef(0);
  const shouldPlayFollowUpAudioRef = useRef(false);
  const wasPausedRef = useRef(paused);

  const playableVideoUri = isPlayableMediaUri(videoUri) ? videoUri : null;
  const playableAudioUri = isPlayableMediaUri(audioUri) ? audioUri : null;
  const mediaPlaybackIdentity = useMemo(
    () =>
      autoPlayKey
        ? `${autoPlayKey}:${playableVideoUri ?? ""}:${playableAudioUri ?? ""}:${playbackSpeed}`
        : null,
    [autoPlayKey, playableAudioUri, playableVideoUri, playbackSpeed]
  );
  const audioSource = useMemo(
    () => (playableAudioUri ? { uri: playableAudioUri } : null),
    [playableAudioUri]
  );

  const audioPlayer = useAudioPlayer(audioSource, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    audioPlayer.setPlaybackRate(playbackSpeed);
  }, [audioPlayer, playbackSpeed]);

  const completeAutoPlaySample = useCallback(
    (completion: LearningSampleCompletion = "played") => {
      if (!autoPlayKey || paused || completedAutoPlayKeyRef.current === autoPlayKey) {
        return;
      }

      completedAutoPlayKeyRef.current = autoPlayKey;
      audioCompletionAutoPlayKeyRef.current = null;
      audioPlaybackRequestRef.current += 1;
      shouldPlayFollowUpAudioRef.current = false;
      onAutoPlaySampleEnd?.(completion);
    },
    [autoPlayKey, onAutoPlaySampleEnd, paused]
  );

  const pauseAll = useCallback(() => {
    audioPlaybackRequestRef.current += 1;
    shouldPlayFollowUpAudioRef.current = false;
    safelyPausePlayer(mouthVideoPlayerRef.current);
    safelyPausePlayer(audioPlayer);
  }, [audioPlayer]);

  const playAudio = useCallback(
    (options?: { completeAutoPlaySampleOnEnd?: boolean }) => {
      shouldPlayFollowUpAudioRef.current = false;
      if (paused) {
        return;
      }

      if (!playableAudioUri) {
        setActiveRole("pronunciation_audio");
        setFeedback("Chưa có âm phát âm để phát.");
        return;
      }

      safelyPausePlayer(mouthVideoPlayerRef.current);
      setActiveRole("pronunciation_audio");
      setFeedback(null);
      audioCompletionAutoPlayKeyRef.current =
        options?.completeAutoPlaySampleOnEnd && autoPlayKey ? autoPlayKey : null;
      const playbackRequest = audioPlaybackRequestRef.current + 1;
      audioPlaybackRequestRef.current = playbackRequest;
      safelyReplayAudioFromStart(
        audioPlayer,
        () => audioPlaybackRequestRef.current === playbackRequest
      );
    },
    [audioPlayer, autoPlayKey, paused, playableAudioUri]
  );

  const playMouthVideo = useCallback(() => {
    shouldPlayFollowUpAudioRef.current = false;
    audioPlaybackRequestRef.current += 1;
    if (paused) {
      return;
    }

    if (!playableVideoUri) {
      setActiveRole("mouth_video");
      setFeedback("Chưa có video khẩu hình để phát.");
      return;
    }

    safelyPausePlayer(audioPlayer);
    setActiveRole("mouth_video");
    setFeedback(null);
    setVideoPlaySignal((value) => value + 1);
  }, [audioPlayer, paused, playableVideoUri]);

  const playQueuedFollowUpAudio = useCallback(() => {
    if (!shouldPlayFollowUpAudioRef.current || !playableAudioUri || paused) {
      return;
    }

    playAudio({ completeAutoPlaySampleOnEnd: true });
  }, [paused, playableAudioUri, playAudio]);

  const handleMouthVideoEnd = useCallback(() => {
    if (shouldPlayFollowUpAudioRef.current && playableAudioUri) {
      playQueuedFollowUpAudio();
      return;
    }

    completeAutoPlaySample();
  }, [completeAutoPlaySample, playableAudioUri, playQueuedFollowUpAudio]);

  const handleMouthVideoPlayStart = useCallback(() => {
    audioPlaybackRequestRef.current += 1;
    safelyPausePlayer(audioPlayer);
    setActiveRole("mouth_video");
    setFeedback(null);
  }, [audioPlayer]);

  const handleMouthVideoError = useCallback(() => {
    safelyPausePlayer(mouthVideoPlayerRef.current);

    if (shouldPlayFollowUpAudioRef.current && playableAudioUri) {
      playQueuedFollowUpAudio();
      return;
    }

    shouldPlayFollowUpAudioRef.current = false;
    setFeedback("Không thể phát video khẩu hình. App sẽ tiếp tục thẻ này.");
    completeAutoPlaySample("unavailable");
  }, [completeAutoPlaySample, playableAudioUri, playQueuedFollowUpAudio]);

  const playSample = useCallback(() => {
    if (playableVideoUri) {
      shouldPlayFollowUpAudioRef.current = Boolean(playableAudioUri);
      audioPlaybackRequestRef.current += 1;
      safelyPausePlayer(audioPlayer);
      setActiveRole("mouth_video");
      setFeedback(null);
      setVideoPlaySignal((value) => value + 1);
      return;
    }

    if (playableAudioUri) {
      playAudio({ completeAutoPlaySampleOnEnd: true });
      return;
    }

    setFeedback("Thẻ này chưa có video hoặc âm phát âm có thể phát.");
  }, [audioPlayer, playableAudioUri, playableVideoUri, playAudio]);

  useEffect(() => {
    if (!audioStatus.didJustFinish || audioCompletionAutoPlayKeyRef.current !== autoPlayKey) {
      return;
    }

    completeAutoPlaySample();
  }, [audioStatus.didJustFinish, autoPlayKey, completeAutoPlaySample]);

  useEffect(() => {
    if (
      !autoPlayKey ||
      paused ||
      activeRole !== "pronunciation_audio" ||
      audioCompletionAutoPlayKeyRef.current !== autoPlayKey ||
      audioStatus.isLoaded
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      audioPlaybackRequestRef.current += 1;
      safelyPausePlayer(audioPlayer);
      setFeedback("Không thể phát âm mẫu. App sẽ chuyển sang lượt con nói.");
      completeAutoPlaySample("unavailable");
    }, audioLoadTimeoutMs);

    return () => clearTimeout(timeout);
  }, [activeRole, audioPlayer, audioStatus.isLoaded, autoPlayKey, completeAutoPlaySample, paused]);

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
    };
  }, [pauseAll]);

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

  const hasRenderableIllustration = isRenderableMediaUri(illustrationUri);
  const stageRole = resolveLearningMediaStageRole({
    activeRole,
    hasRenderableIllustration,
    hasPlayableVideo: Boolean(playableVideoUri)
  });
  const visualPlaceholderLabel = getLearningVisualPlaceholderLabel({
    hasRenderableIllustration,
    hasPlayableVideo: Boolean(playableVideoUri)
  });

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {stageRole === "mouth_video" && playableVideoUri ? (
          <MouthVideoPlayer
            ref={mouthVideoPlayerRef}
            onEnd={handleMouthVideoEnd}
            onError={handleMouthVideoError}
            onPlayStart={handleMouthVideoPlayStart}
            paused={paused}
            playSignal={videoPlaySignal}
            playbackSpeed={playbackSpeed}
            uri={playableVideoUri}
          />
        ) : (
          <View style={styles.illustrationStage}>
            <MediaPlaceholder
              fallbackLabel={visualPlaceholderLabel}
              large
              media={illustration}
              role="illustration"
            />
            {activeRole === "pronunciation_audio" && playableAudioUri ? (
              <Pressable
                accessibilityLabel={audioStatus.playing ? "Đang phát âm mẫu" : "Phát âm phát âm"}
                accessibilityRole="button"
                onPress={() => playAudio()}
                style={({ pressed }) => [styles.audioOverlay, pressed ? styles.pressed : null]}
              >
                <Volume2 color={colors.onPrimary} size={26} />
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.mediaChips}>
        <MediaChip
          active={activeRole === "mouth_video"}
          available={Boolean(playableVideoUri)}
          icon={
            <Play
              color={activeRole === "mouth_video" ? colors.onPrimary : colors.muted}
              size={17}
            />
          }
          label="Khẩu hình"
          onPress={playMouthVideo}
        />
        <MediaChip
          active={activeRole === "pronunciation_audio"}
          available={Boolean(playableAudioUri)}
          icon={
            <Volume2
              color={activeRole === "pronunciation_audio" ? colors.onPrimary : colors.muted}
              size={17}
            />
          }
          label="Âm phát âm"
          onPress={() => playAudio()}
        />
      </View>
      {feedback ? (
        <AppText align="center" color="secondary" variant="meta">
          {feedback}
        </AppText>
      ) : null}
    </View>
  );
}

const MouthVideoPlayer = forwardRef<
  MouthVideoPlayerHandle,
  {
    onEnd: () => void;
    onError: () => void;
    onPlayStart: () => void;
    paused: boolean;
    playbackSpeed: PlaybackSpeed;
    playSignal: number;
    uri: string;
  }
>(function MouthVideoPlayer(
  { onEnd, onError, onPlayStart, paused, playbackSpeed, playSignal, uri },
  ref
) {
  const [isPlayOverlayVisible, setPlayOverlayVisible] = useState(true);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoPlayer = useVideoPlayer({ uri }, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
    player.audioMixingMode = "doNotMix";
  });

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

  const replayVideo = useCallback(() => {
    if (videoPlayer.status === "error") {
      onError();
      return;
    }

    onPlayStart();
    showPlayOverlay();
    safelyReplayVideoFromStart(videoPlayer);
  }, [onError, onPlayStart, showPlayOverlay, videoPlayer]);

  useImperativeHandle(
    ref,
    () => ({
      pause: () => safelyPausePlayer(videoPlayer)
    }),
    [videoPlayer]
  );

  useEventListener(videoPlayer, "playToEnd", onEnd);
  useEventListener(videoPlayer, "statusChange", ({ status }) => {
    if (status === "error") {
      onError();
    }
  });

  useEffect(() => {
    setVideoPlaybackRate(videoPlayer, playbackSpeed);
  }, [playbackSpeed, videoPlayer]);

  useEffect(() => {
    if (playSignal <= 0) {
      return;
    }

    replayVideo();
  }, [playSignal, replayVideo]);

  useEffect(() => {
    if (paused) {
      safelyPausePlayer(videoPlayer);
    }
  }, [paused, videoPlayer]);

  useEffect(() => {
    return () => {
      clearOverlayTimer();
    };
  }, [clearOverlayTimer]);

  return (
    <MediaContainer size="large" style={styles.videoPressable}>
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
        onPress={isPlayOverlayVisible ? replayVideo : showPlayOverlay}
        style={styles.videoTapLayer}
      >
        {isPlayOverlayVisible ? (
          <View style={styles.playOverlay}>
            <Play color={colors.onPrimary} fill={colors.mediaOverlayLight} size={30} />
          </View>
        ) : null}
      </Pressable>
    </MediaContainer>
  );
});

function setVideoPlaybackRate(
  videoPlayer: { playbackRate: number },
  playbackSpeed: PlaybackSpeed
): void {
  try {
    videoPlayer.playbackRate = playbackSpeed;
  } catch {
    // Some Expo Go native runtimes expose playbackRate as read-only despite the JS type.
  }
}

function safelyPausePlayer(player: { pause: () => void } | null | undefined): void {
  try {
    player?.pause();
  } catch {
    // Expo can release native shared objects before React cleanup calls pause.
  }
}

function safelyPlayPlayer(player: { play: () => void } | null | undefined): void {
  try {
    player?.play();
  } catch {
    // Ignore stale native player calls during fast unmount/remount cycles.
  }
}

function safelyReplayAudioFromStart(
  player: {
    play: () => void;
    seekTo: (seconds: number) => Promise<void>;
  },
  shouldPlay: () => boolean
): void {
  const playIfCurrent = () => {
    if (shouldPlay()) {
      safelyPlayPlayer(player);
    }
  };

  try {
    void player.seekTo(0).then(playIfCurrent).catch(playIfCurrent);
  } catch {
    playIfCurrent();
  }
}

function safelyReplayVideoFromStart(player: {
  currentTime: number;
  pause: () => void;
  play: () => void;
  replay: () => void;
}): void {
  safelyPausePlayer(player);

  try {
    player.currentTime = 0;
    safelyPlayPlayer(player);
  } catch {
    try {
      player.replay();
      safelyPlayPlayer(player);
    } catch {
      // The video shared object may already be released on native teardown.
    }
  }
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
      <AppText
        align="center"
        color={active ? "onPrimary" : "muted"}
        style={styles.mediaChipText}
        variant="meta"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function isPlayableMediaUri(uri: string | null): uri is string {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}

function isRenderableMediaUri(uri: string | null): uri is string {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[12]
  },
  stage: {
    overflow: "hidden"
  },
  videoPressable: {
    padding: 0
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
    backgroundColor: colors.mediaOverlay,
    borderRadius: radii.full,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  audioOverlay: {
    alignItems: "center",
    backgroundColor: colors.mediaOverlayStrong,
    borderRadius: radii.full,
    bottom: spacing[14],
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: spacing[14],
    width: 52
  },
  mediaChips: {
    flexDirection: "row",
    gap: spacing[12]
  },
  mediaChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    flex: 1,
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing[12]
  },
  mediaChipActive: {
    backgroundColor: colors.coral
  },
  mediaChipUnavailable: {
    opacity: 0.72
  },
  mediaChipText: {
    flexShrink: 1
  },
  pressed: {
    opacity: 0.82
  }
});
