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
import { Animated, AppState, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { MediaContainer } from "@/components/MediaContainer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItemMedia, PlaybackSpeed } from "@/data/types";
import type { ActiveLearningMediaRole } from "@/features/learning/learningMediaStage";
import {
  mediaResolveTimeoutMs,
  usePlaybackProgressFailSafe
} from "@/features/learning/learningSampleFailSafe";
import {
  configureMouthVideoPlayer,
  hasMouthVideoReachedEnd,
  learningAudioPlayerOptions,
  MouthVideoPlaybackAttempts,
  replayMouthVideoFromStart
} from "@/features/learning/mouthVideoPlayback";
import { useDisplayMedia } from "@/features/media/useDisplayMediaUri";
import { colors, radii, spacing } from "@/theme";

interface MouthVideoPlayerHandle {
  pause(): void;
}

export type LearningSampleCompletion = "played" | "unavailable";

export function LearningMediaPlayer({
  illustration,
  mouthVideo,
  pronunciationAudio,
  autoPlayKey,
  onAutoPlaySampleEnd,
  onRequestResume,
  manageAppStateExternally = false,
  paused = false,
  playbackSpeed = 1
}: {
  illustration?: LearningItemMedia;
  mouthVideo?: LearningItemMedia;
  pronunciationAudio?: LearningItemMedia;
  autoPlayKey?: string | null;
  manageAppStateExternally?: boolean;
  onAutoPlaySampleEnd?: (completion: LearningSampleCompletion) => void;
  onRequestResume?: () => void;
  paused?: boolean;
  playbackSpeed?: PlaybackSpeed;
}) {
  const illustrationResolution = useDisplayMedia(illustration?.asset.uri ?? null);
  const videoResolution = useDisplayMedia(mouthVideo?.asset.uri ?? null);
  const audioResolution = useDisplayMedia(pronunciationAudio?.asset.uri ?? null);
  const [activeRole, setActiveRole] = useState<ActiveLearningMediaRole>(
    illustration ? "illustration" : "mouth_video"
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [audioPlaybackAttempt, setAudioPlaybackAttempt] = useState(0);
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [mediaPreparationTimeoutKey, setMediaPreparationTimeoutKey] = useState<string | null>(null);
  const [videoPlayRequest, setVideoPlayRequest] = useState<{
    scope: string | null;
    signal: number;
  }>({ scope: null, signal: 0 });
  const mouthVideoPlayerRef = useRef<MouthVideoPlayerHandle | null>(null);
  const lastAutoPlayKeyRef = useRef<string | null>(null);
  const completedAutoPlayKeyRef = useRef<string | null>(null);
  const audioCompletionAutoPlayKeyRef = useRef<string | null>(null);
  const audioPlaybackRequestRef = useRef(0);
  const audioStartedRequestRef = useRef<number | null>(null);
  const shouldPlayFollowUpAudioRef = useRef(false);
  const playbackPaused = paused || isLocallyPaused;
  const wasPausedRef = useRef(playbackPaused);

  const playableVideoUri = isPlayableMediaUri(videoResolution.uri) ? videoResolution.uri : null;
  const playableAudioUri = isPlayableMediaUri(audioResolution.uri) ? audioResolution.uri : null;
  const playableIllustrationVideoUri =
    isPlayableMediaUri(illustrationResolution.uri) &&
    isVideoMedia(illustration, illustrationResolution.uri)
      ? illustrationResolution.uri
      : null;
  const isSampleMediaSettled =
    (!mouthVideo || videoResolution.status !== "resolving") &&
    (!pronunciationAudio || audioResolution.status !== "resolving");
  const isSampleMediaReady = isSampleMediaSettled || mediaPreparationTimeoutKey === autoPlayKey;
  const mediaPlaybackIdentity = useMemo(
    () => (autoPlayKey ? `${autoPlayKey}:${playbackSpeed}` : null),
    [autoPlayKey, playbackSpeed]
  );
  const videoPlaybackScope =
    autoPlayKey ?? (playableVideoUri ? `manual:${playableVideoUri}` : null);
  const audioSource = useMemo(
    () => (playableAudioUri ? { uri: playableAudioUri } : null),
    [playableAudioUri]
  );
  const hasLogicalSampleMedia = Boolean(mouthVideo || pronunciationAudio);
  const hasPlayableSampleMedia = Boolean(playableVideoUri || playableAudioUri);

  const audioPlayer = useAudioPlayer(audioSource, learningAudioPlayerOptions);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    audioPlayer.setPlaybackRate(playbackSpeed);
  }, [audioPlayer, playbackSpeed]);

  const completeAutoPlaySample = useCallback(
    (completion: LearningSampleCompletion = "played") => {
      if (!autoPlayKey || playbackPaused || completedAutoPlayKeyRef.current === autoPlayKey) {
        return;
      }

      completedAutoPlayKeyRef.current = autoPlayKey;
      audioCompletionAutoPlayKeyRef.current = null;
      audioPlaybackRequestRef.current += 1;
      audioStartedRequestRef.current = null;
      shouldPlayFollowUpAudioRef.current = false;
      onAutoPlaySampleEnd?.(completion);
    },
    [autoPlayKey, onAutoPlaySampleEnd, playbackPaused]
  );

  const pauseAll = useCallback(() => {
    audioPlaybackRequestRef.current += 1;
    audioStartedRequestRef.current = null;
    shouldPlayFollowUpAudioRef.current = false;
    safelyPausePlayer(mouthVideoPlayerRef.current);
    safelyPausePlayer(audioPlayer);
  }, [audioPlayer]);
  const pauseAllRef = useRef(pauseAll);
  pauseAllRef.current = pauseAll;
  const requestResume = useCallback(() => {
    setIsLocallyPaused(false);
    onRequestResume?.();
  }, [onRequestResume]);
  const requestMouthVideoPlayback = useCallback(() => {
    if (!videoPlaybackScope) {
      return;
    }

    setVideoPlayRequest((current) => ({
      scope: videoPlaybackScope,
      signal: current.signal + 1
    }));
  }, [videoPlaybackScope]);

  useEffect(() => {
    if (
      !autoPlayKey ||
      playbackPaused ||
      !hasLogicalSampleMedia ||
      completedAutoPlayKeyRef.current === autoPlayKey
    ) {
      return;
    }

    if (isSampleMediaReady) {
      if (!hasPlayableSampleMedia) {
        setFeedback("Không thể chuẩn bị video hoặc âm phát âm. App sẽ tiếp tục thẻ này.");
        completeAutoPlaySample("unavailable");
      }
      return;
    }

    const timeout = setTimeout(() => {
      setMediaPreparationTimeoutKey(autoPlayKey);
    }, mediaResolveTimeoutMs);

    return () => clearTimeout(timeout);
  }, [
    autoPlayKey,
    completeAutoPlaySample,
    hasLogicalSampleMedia,
    hasPlayableSampleMedia,
    isSampleMediaReady,
    playbackPaused
  ]);

  const playAudio = useCallback(
    (options?: { completeAutoPlaySampleOnEnd?: boolean }) => {
      shouldPlayFollowUpAudioRef.current = false;
      if (playbackPaused) {
        requestResume();
        return;
      }

      if (!playableAudioUri) {
        setActiveRole("pronunciation_audio");
        setFeedback("Chưa có âm phát âm để phát.");
        return;
      }

      safelyPausePlayer(mouthVideoPlayerRef.current);
      safelyPausePlayer(audioPlayer);
      setActiveRole("pronunciation_audio");
      setFeedback(null);
      audioCompletionAutoPlayKeyRef.current =
        options?.completeAutoPlaySampleOnEnd && autoPlayKey ? autoPlayKey : null;
      const playbackRequest = audioPlaybackRequestRef.current + 1;
      audioPlaybackRequestRef.current = playbackRequest;
      audioStartedRequestRef.current = null;
      setAudioPlaybackAttempt(playbackRequest);
      safelyReplayAudioFromStart(
        audioPlayer,
        () => audioPlaybackRequestRef.current === playbackRequest
      );
    },
    [audioPlayer, autoPlayKey, playbackPaused, playableAudioUri, requestResume]
  );

  const playMouthVideo = useCallback(() => {
    shouldPlayFollowUpAudioRef.current = false;
    audioPlaybackRequestRef.current += 1;
    if (playbackPaused) {
      requestResume();
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
    requestMouthVideoPlayback();
  }, [audioPlayer, playbackPaused, playableVideoUri, requestMouthVideoPlayback, requestResume]);

  const playQueuedFollowUpAudio = useCallback(() => {
    if (!shouldPlayFollowUpAudioRef.current || !playableAudioUri || playbackPaused) {
      return;
    }

    playAudio({ completeAutoPlaySampleOnEnd: true });
  }, [playbackPaused, playableAudioUri, playAudio]);

  const handleMouthVideoEnd = useCallback(() => {
    if (shouldPlayFollowUpAudioRef.current && playableAudioUri) {
      playQueuedFollowUpAudio();
      return;
    }

    completeAutoPlaySample();
  }, [completeAutoPlaySample, playableAudioUri, playQueuedFollowUpAudio]);

  const handleMouthVideoPlayStart = useCallback(() => {
    audioPlaybackRequestRef.current += 1;
    setActiveRole("mouth_video");
    setFeedback(null);
  }, []);

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
      requestMouthVideoPlayback();
      return;
    }

    if (playableAudioUri) {
      playAudio({ completeAutoPlaySampleOnEnd: true });
      return;
    }

    setFeedback("Thẻ này chưa có video hoặc âm phát âm có thể phát.");
  }, [audioPlayer, playableAudioUri, playableVideoUri, playAudio, requestMouthVideoPlayback]);

  const activeAutoPlayAudioAttempt =
    autoPlayKey &&
    !playbackPaused &&
    activeRole === "pronunciation_audio" &&
    audioCompletionAutoPlayKeyRef.current === autoPlayKey &&
    audioPlaybackAttempt > 0
      ? audioPlaybackAttempt
      : null;

  const handleAudioPlaybackTimeout = useCallback(() => {
    if (
      !autoPlayKey ||
      playbackPaused ||
      audioPlaybackAttempt !== audioPlaybackRequestRef.current ||
      audioCompletionAutoPlayKeyRef.current !== autoPlayKey ||
      completedAutoPlayKeyRef.current === autoPlayKey
    ) {
      return;
    }

    audioPlaybackRequestRef.current += 1;
    audioStartedRequestRef.current = null;
    safelyPausePlayer(audioPlayer);
    setFeedback("Âm phát âm mất phản hồi. App sẽ chuyển sang lượt con nói.");
    completeAutoPlaySample("unavailable");
  }, [audioPlayer, audioPlaybackAttempt, autoPlayKey, completeAutoPlaySample, playbackPaused]);

  usePlaybackProgressFailSafe({
    attemptKey: activeAutoPlayAudioAttempt,
    paused: playbackPaused,
    playing: audioStatus.playing,
    progressSeconds: audioStatus.currentTime,
    onPlaybackStarted: (attemptKey) => {
      if (typeof attemptKey === "number" && attemptKey === audioPlaybackRequestRef.current) {
        audioStartedRequestRef.current = attemptKey;
      }
    },
    onTimeout: handleAudioPlaybackTimeout
  });

  useEffect(() => {
    if (
      !audioStatus.didJustFinish ||
      audioCompletionAutoPlayKeyRef.current !== autoPlayKey ||
      audioStartedRequestRef.current !== audioPlaybackAttempt ||
      audioPlaybackRequestRef.current !== audioPlaybackAttempt
    ) {
      return;
    }

    completeAutoPlaySample();
  }, [audioPlaybackAttempt, audioStatus.didJustFinish, autoPlayKey, completeAutoPlaySample]);

  useEffect(() => {
    const wasPaused = wasPausedRef.current;
    wasPausedRef.current = playbackPaused;

    if (
      !wasPaused ||
      playbackPaused ||
      !autoPlayKey ||
      !mediaPlaybackIdentity ||
      !isSampleMediaReady ||
      !hasPlayableSampleMedia ||
      lastAutoPlayKeyRef.current !== mediaPlaybackIdentity ||
      completedAutoPlayKeyRef.current === autoPlayKey
    ) {
      return;
    }

    playSample();
  }, [
    autoPlayKey,
    hasPlayableSampleMedia,
    isSampleMediaReady,
    mediaPlaybackIdentity,
    playbackPaused,
    playSample
  ]);

  useEffect(() => {
    if (playbackPaused) {
      pauseAll();
    }
  }, [pauseAll, playbackPaused]);

  useEffect(() => {
    if (manageAppStateExternally) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        setIsLocallyPaused(true);
        pauseAll();
      }
    });

    return () => subscription.remove();
  }, [manageAppStateExternally, pauseAll]);

  useEffect(() => {
    return () => {
      pauseAllRef.current();
    };
  }, []);

  useEffect(() => {
    if (!autoPlayKey || playbackPaused || !isSampleMediaReady || !hasPlayableSampleMedia) {
      return;
    }

    if (!mediaPlaybackIdentity || lastAutoPlayKeyRef.current === mediaPlaybackIdentity) {
      return;
    }

    lastAutoPlayKeyRef.current = mediaPlaybackIdentity;
    playSample();
  }, [
    autoPlayKey,
    hasPlayableSampleMedia,
    isSampleMediaReady,
    mediaPlaybackIdentity,
    playbackPaused,
    playSample
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.illustrationSection}>
        <InteractiveIllustrationSlot
          illustration={illustration}
          illustrationUri={playableIllustrationVideoUri}
          isVideo={Boolean(playableIllustrationVideoUri)}
          onPress={() => playAudio()}
          paused={playbackPaused}
        />
      </View>

      <View style={styles.mediaSection}>
        {playableVideoUri ? (
          <MouthVideoPlayer
            ref={mouthVideoPlayerRef}
            onEnd={handleMouthVideoEnd}
            onError={handleMouthVideoError}
            onPlayStart={handleMouthVideoPlayStart}
            onRequestResume={requestResume}
            paused={playbackPaused}
            playRequestActive={videoPlayRequest.scope === videoPlaybackScope}
            playSignal={videoPlayRequest.signal}
            playbackSpeed={playbackSpeed}
            uri={playableVideoUri}
          />
        ) : (
          <MediaPlaceholder
            fallbackLabel="Chưa có video khẩu hình"
            large
            media={mouthVideo}
            role="mouth_video"
            style={styles.videoPlaceholder}
          />
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
    onRequestResume?: () => void;
    paused: boolean;
    playRequestActive: boolean;
    playbackSpeed: PlaybackSpeed;
    playSignal: number;
    uri: string;
  }
>(function MouthVideoPlayer(
  {
    onEnd,
    onError,
    onPlayStart,
    onRequestResume,
    paused,
    playbackSpeed,
    playRequestActive,
    playSignal,
    uri
  },
  ref
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLocallyPaused, setIsLocallyPaused] = useState(false);
  const [activePlaybackAttempt, setActivePlaybackAttempt] = useState<number | null>(null);
  const [playbackProgressSeconds, setPlaybackProgressSeconds] = useState(0);
  const playbackAttemptsRef = useRef<MouthVideoPlaybackAttempts | null>(null);
  playbackAttemptsRef.current ??= new MouthVideoPlaybackAttempts();
  const playbackAttempts = playbackAttemptsRef.current;
  const lastHandledPlaySignalRef = useRef(0);
  const pausedRef = useRef(paused);
  const playRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoPlayer = useVideoPlayer({ uri }, (player) => {
    configureMouthVideoPlayer(player);
  });

  pausedRef.current = paused;
  const playbackPaused = paused || isLocallyPaused;

  const clearPlayRetry = useCallback(() => {
    if (playRetryTimerRef.current !== null) {
      clearTimeout(playRetryTimerRef.current);
      playRetryTimerRef.current = null;
    }
  }, []);

  const claimPendingPlaybackAttempt = useCallback(
    (outcome: "end" | "error") => {
      const pendingAttempt =
        outcome === "end" ? playbackAttempts.claimEnd() : playbackAttempts.claimError();
      if (pendingAttempt === null) {
        return false;
      }

      clearPlayRetry();
      setActivePlaybackAttempt((current) => (current === pendingAttempt ? null : current));
      return true;
    },
    [clearPlayRetry, playbackAttempts]
  );

  const reportPlaybackError = useCallback(() => {
    if (!claimPendingPlaybackAttempt("error")) {
      return;
    }

    setIsPlaying(false);
    onError();
  }, [claimPendingPlaybackAttempt, onError]);

  const reportPlaybackEnd = useCallback(() => {
    if (!hasMouthVideoReachedEnd(videoPlayer)) {
      return;
    }

    if (!claimPendingPlaybackAttempt("end")) {
      return;
    }

    setIsPlaying(false);
    onEnd();
  }, [claimPendingPlaybackAttempt, onEnd, videoPlayer]);

  usePlaybackProgressFailSafe({
    attemptKey: playRequestActive ? activePlaybackAttempt : null,
    paused: playbackPaused,
    playing: isPlaying,
    progressSeconds: playbackProgressSeconds,
    onPlaybackStarted: (attemptKey) => {
      if (typeof attemptKey === "number" && playbackAttempts.isActive(attemptKey)) {
        playbackAttempts.markStarted();
      }
    },
    onTimeout: reportPlaybackError
  });

  const startPendingPlayback = useCallback(
    (isReady = videoPlayer.status === "readyToPlay") => {
      if (paused || !isReady) {
        return;
      }

      const pendingAttempt = playbackAttempts.tryStart();
      if (pendingAttempt === null) {
        return;
      }

      clearPlayRetry();
      configureMouthVideoPlayer(videoPlayer);
      onPlayStart();
      replayMouthVideoFromStart(videoPlayer);
      setVideoPlaybackRate(videoPlayer, playbackSpeed);

      playRetryTimerRef.current = setTimeout(() => {
        playRetryTimerRef.current = null;
        if (
          pausedRef.current ||
          videoPlayer.playing ||
          videoPlayer.status !== "readyToPlay" ||
          !playbackAttempts.isActive(pendingAttempt)
        ) {
          return;
        }

        configureMouthVideoPlayer(videoPlayer);
        safelyPlayPlayer(videoPlayer);
      }, 300);
    },
    [clearPlayRetry, onPlayStart, paused, playbackAttempts, playbackSpeed, videoPlayer]
  );

  const beginPlaybackAttempt = useCallback(() => {
    const playbackAttempt = playbackAttempts.begin();
    setActivePlaybackAttempt(playbackAttempt);
    setPlaybackProgressSeconds(0);

    if (videoPlayer.status === "error") {
      reportPlaybackError();
      return;
    }

    startPendingPlayback();
  }, [playbackAttempts, reportPlaybackError, startPendingPlayback, videoPlayer]);
  const beginPlaybackAttemptRef = useRef(beginPlaybackAttempt);
  beginPlaybackAttemptRef.current = beginPlaybackAttempt;

  const replayVideo = useCallback(() => {
    if (paused) {
      onRequestResume?.();
      return;
    }

    setIsLocallyPaused(false);
    beginPlaybackAttempt();
  }, [beginPlaybackAttempt, onRequestResume, paused]);

  const toggleVideoPlayback = useCallback(() => {
    if (paused) {
      onRequestResume?.();
      return;
    }

    if (isPlaying) {
      setIsLocallyPaused(true);
      safelyPausePlayer(videoPlayer);
      setIsPlaying(false);
      return;
    }

    if (isLocallyPaused) {
      setIsLocallyPaused(false);
      safelyPlayPlayer(videoPlayer);
      return;
    }

    replayVideo();
  }, [isLocallyPaused, isPlaying, onRequestResume, paused, replayVideo, videoPlayer]);

  useImperativeHandle(
    ref,
    () => ({
      pause: () => safelyPausePlayer(videoPlayer)
    }),
    [videoPlayer]
  );

  useEventListener(videoPlayer, "playToEnd", reportPlaybackEnd);
  useEventListener(videoPlayer, "playingChange", ({ isPlaying: nextIsPlaying }) => {
    if (nextIsPlaying) {
      if (pausedRef.current || !playbackAttempts.isActive()) {
        safelyPausePlayer(videoPlayer);
        setIsPlaying(false);
        return;
      }
      playbackAttempts.markStarted();
      clearPlayRetry();
    }
    setIsPlaying(nextIsPlaying);
  });
  useEventListener(videoPlayer, "timeUpdate", ({ currentTime }) => {
    if (Number.isFinite(currentTime) && currentTime >= 0) {
      if (currentTime > 0 && playbackAttempts.isActive()) {
        playbackAttempts.markStarted();
      }
      setPlaybackProgressSeconds(currentTime);
    }
  });
  useEventListener(videoPlayer, "statusChange", ({ status }) => {
    if (status === "error") {
      reportPlaybackError();
      return;
    }

    if (status === "readyToPlay") {
      startPendingPlayback(true);
    }
  });

  useEffect(() => {
    clearPlayRetry();
    playbackAttempts.resetSource();
    setActivePlaybackAttempt(null);
    setIsPlaying(false);
    setPlaybackProgressSeconds(0);
  }, [clearPlayRetry, playbackAttempts, uri, videoPlayer]);

  useEffect(() => {
    if (!playRequestActive) {
      playbackAttempts.cancel();
      setActivePlaybackAttempt(null);
      clearPlayRetry();
      return;
    }

    if (playSignal <= 0 || lastHandledPlaySignalRef.current === playSignal) {
      return;
    }

    lastHandledPlaySignalRef.current = playSignal;
    setIsLocallyPaused(false);
    beginPlaybackAttemptRef.current();
  }, [clearPlayRetry, playRequestActive, playbackAttempts, playSignal]);

  useEffect(() => {
    if (!playbackPaused && isPlaying) {
      setVideoPlaybackRate(videoPlayer, playbackSpeed);
    }
  }, [isPlaying, playbackPaused, playbackSpeed, videoPlayer]);

  useEffect(() => {
    if (paused) {
      playbackAttempts.cancel();
      clearPlayRetry();
      safelyPausePlayer(videoPlayer);
      setActivePlaybackAttempt(null);
      setIsPlaying(false);
    }
  }, [clearPlayRetry, paused, playbackAttempts, videoPlayer]);

  useEffect(() => {
    return () => {
      clearPlayRetry();
    };
  }, [clearPlayRetry]);

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
        accessibilityLabel={
          isPlaying
            ? "Tạm dừng video khẩu hình"
            : isLocallyPaused
              ? "Tiếp tục video khẩu hình"
              : "Phát video khẩu hình"
        }
        accessibilityRole="button"
        onPress={toggleVideoPlayback}
        style={styles.videoTapLayer}
      />
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

function isVideoMedia(media?: LearningItemMedia, resolvedUri?: string | null): boolean {
  if (media?.asset.type === "video") {
    return true;
  }
  if (media?.asset.mimeType?.startsWith("video/")) {
    return true;
  }
  if (resolvedUri) {
    const lower = resolvedUri.toLowerCase();
    if (
      lower.endsWith(".mp4") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".m4v")
    ) {
      return true;
    }
  }
  return false;
}

function IllustrationVideoPlayer({
  uri,
  paused,
  onPress
}: {
  uri: string;
  paused: boolean;
  onPress?: () => void;
}) {
  const videoPlayer = useVideoPlayer({ uri }, (player) => {
    try {
      player.muted = true;
      player.volume = 0;
      player.loop = true;
    } catch {
      // Safe fallback
    }
  });

  useEffect(() => {
    try {
      videoPlayer.muted = true;
      videoPlayer.volume = 0;
      videoPlayer.loop = true;
      if (paused) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
    } catch {
      // Safe fallback
    }
  }, [paused, videoPlayer]);

  useEffect(() => {
    return () => {
      safelyPausePlayer(videoPlayer);
    };
  }, [videoPlayer]);

  return (
    <Pressable
      accessibilityLabel="Minh hoạ hành động"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.illustrationVideoFrame}
    >
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={videoPlayer}
        playsInline
        style={styles.video}
      />
    </Pressable>
  );
}

function InteractiveIllustrationSlot({
  illustration,
  illustrationUri,
  isVideo,
  paused,
  onPress
}: {
  illustration?: LearningItemMedia;
  illustrationUri?: string | null;
  isVideo: boolean;
  paused: boolean;
  onPress?: () => void;
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true
      })
    ]).start();

    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      {isVideo && illustrationUri ? (
        <IllustrationVideoPlayer
          onPress={handlePress}
          paused={paused}
          uri={illustrationUri}
        />
      ) : (
        <Pressable
          accessibilityLabel="Chạm để nghe âm thanh"
          accessibilityRole="button"
          onPress={handlePress}
        >
          <MediaPlaceholder
            fallbackLabel="Chưa có hình minh hoạ"
            media={illustration}
            role="illustration"
            style={styles.illustrationMedia}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

function isPlayableMediaUri(uri: string | null): uri is string {
  return Boolean(uri && !uri.startsWith("seed://") && !uri.startsWith("data:"));
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[8],
    width: "100%"
  },
  illustrationSection: {
    alignItems: "center",
    gap: spacing[4],
    justifyContent: "center",
    width: "100%"
  },
  mediaSection: {
    alignSelf: "stretch",
    gap: spacing[4],
    width: "100%"
  },
  illustrationMedia: {
    alignSelf: "center",
    aspectRatio: 1,
    borderRadius: radii.xl,
    height: 130,
    minHeight: 0,
    padding: spacing[8],
    width: 130
  },
  illustrationVideoFrame: {
    alignItems: "center",
    alignSelf: "center",
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    elevation: 2,
    height: 130,
    justifyContent: "center",
    minHeight: 0,
    overflow: "hidden",
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 130
  },
  videoPressable: {
    alignSelf: "stretch",
    aspectRatio: 1.55,
    borderRadius: radii.xl,
    maxHeight: 240,
    minHeight: 160,
    overflow: "hidden",
    padding: 0,
    width: "100%"
  },
  videoPlaceholder: {
    alignSelf: "stretch",
    aspectRatio: 1.55,
    borderRadius: radii.xl,
    maxHeight: 240,
    minHeight: 160,
    overflow: "hidden",
    width: "100%"
  },
  video: {
    height: "100%",
    width: "100%"
  },
  videoTapLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  mediaChips: {
    flexDirection: "row",
    gap: spacing[12],
    width: "100%"
  },
  mediaChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderColor: colors.borderSoft,
    borderRadius: radii.full,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing[12],
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8
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
