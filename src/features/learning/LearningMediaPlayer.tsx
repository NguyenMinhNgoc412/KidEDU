import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play, Volume2 } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import type { LearningItemMedia, MediaRole } from "@/data/types";
import { useDisplayMediaUri } from "@/features/media/useDisplayMediaUri";
import { colors, radii } from "@/theme";

type ActiveMediaRole = Extract<MediaRole, "illustration" | "mouth_video" | "pronunciation_audio">;

export function LearningMediaPlayer({
  illustration,
  mouthVideo,
  pronunciationAudio,
  autoPlayKey,
  paused = false
}: {
  illustration?: LearningItemMedia;
  mouthVideo?: LearningItemMedia;
  pronunciationAudio?: LearningItemMedia;
  autoPlayKey?: string | null;
  paused?: boolean;
}) {
  const illustrationUri = useDisplayMediaUri(illustration?.asset.uri ?? null);
  const videoUri = useDisplayMediaUri(mouthVideo?.asset.uri ?? null);
  const audioUri = useDisplayMediaUri(pronunciationAudio?.asset.uri ?? null);
  const [activeRole, setActiveRole] = useState<ActiveMediaRole>(illustration ? "illustration" : "mouth_video");
  const [feedback, setFeedback] = useState<string | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoPlayKeyRef = useRef<string | null>(null);

  const playableVideoUri = isPlayableMediaUri(videoUri) ? videoUri : null;
  const playableAudioUri = isPlayableMediaUri(audioUri) ? audioUri : null;
  const audioSource = useMemo(() => (playableAudioUri ? { uri: playableAudioUri } : null), [playableAudioUri]);
  const videoSource = useMemo(() => (playableVideoUri ? { uri: playableVideoUri } : null), [playableVideoUri]);

  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
    player.audioMixingMode = "doNotMix";
  });
  const audioPlayer = useAudioPlayer(audioSource, { updateInterval: 500 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const clearAudioTimer = useCallback(() => {
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  }, []);

  const pauseAll = useCallback(() => {
    clearAudioTimer();
    videoPlayer.pause();
    audioPlayer.pause();
  }, [audioPlayer, clearAudioTimer, videoPlayer]);

  const playAudio = useCallback(() => {
    if (!playableAudioUri) {
      setActiveRole("pronunciation_audio");
      setFeedback("Chưa có âm phát âm để phát.");
      return;
    }

    clearAudioTimer();
    videoPlayer.pause();
    setActiveRole("pronunciation_audio");
    setFeedback(null);
    void audioPlayer.seekTo(0).finally(() => audioPlayer.play());
  }, [audioPlayer, clearAudioTimer, playableAudioUri, videoPlayer]);

  const playMouthVideo = useCallback(() => {
    if (!playableVideoUri) {
      setActiveRole("mouth_video");
      setFeedback("Chưa có video khẩu hình để phát.");
      return;
    }

    clearAudioTimer();
    audioPlayer.pause();
    setActiveRole("mouth_video");
    setFeedback(null);
    videoPlayer.replay();
    videoPlayer.play();
  }, [audioPlayer, clearAudioTimer, playableVideoUri, videoPlayer]);

  const playSample = useCallback(() => {
    clearAudioTimer();

    if (playableVideoUri) {
      audioPlayer.pause();
      setActiveRole("mouth_video");
      setFeedback(null);
      videoPlayer.replay();
      videoPlayer.play();

      if (playableAudioUri) {
        audioTimerRef.current = setTimeout(() => {
          videoPlayer.pause();
          setActiveRole("pronunciation_audio");
          void audioPlayer.seekTo(0).finally(() => audioPlayer.play());
        }, 1100);
      }
      return;
    }

    if (playableAudioUri) {
      playAudio();
      return;
    }

    setFeedback("Thẻ này chưa có video hoặc âm phát âm có thể phát.");
  }, [audioPlayer, clearAudioTimer, playableAudioUri, playableVideoUri, playAudio, videoPlayer]);

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
    return () => pauseAll();
  }, [pauseAll]);

  useEffect(() => {
    if (!autoPlayKey || paused) {
      return;
    }

    const mediaKey = `${autoPlayKey}:${playableVideoUri ?? ""}:${playableAudioUri ?? ""}`;
    if (lastAutoPlayKeyRef.current === mediaKey) {
      return;
    }

    lastAutoPlayKeyRef.current = mediaKey;
    playSample();
  }, [autoPlayKey, paused, playableAudioUri, playableVideoUri, playSample]);

  const hasRenderableIllustration = Boolean(illustrationUri && !illustrationUri.startsWith("seed://"));
  const mainRole = resolveMainRole(activeRole, hasRenderableIllustration, playableVideoUri, playableAudioUri);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {mainRole === "mouth_video" && playableVideoUri ? (
          <Pressable accessibilityLabel="Phát khẩu hình" accessibilityRole="button" onPress={playMouthVideo} style={styles.videoPressable}>
            <VideoView
              contentFit="cover"
              nativeControls={false}
              player={videoPlayer}
              playsInline
              style={styles.video}
            />
            <View style={styles.playOverlay}>
              <Play color="#FFFFFF" fill="rgba(255,255,255,0.9)" size={30} />
            </View>
          </Pressable>
        ) : mainRole === "pronunciation_audio" ? (
          <Pressable accessibilityLabel="Phát âm phát âm" accessibilityRole="button" onPress={playAudio} style={styles.audioStage}>
            <Volume2 color={audioStatus.playing ? colors.coral : colors.blue} size={44} />
            <Text style={styles.audioTitle}>{audioStatus.playing ? "Đang phát âm mẫu" : "Âm phát âm"}</Text>
          </Pressable>
        ) : (
          <MediaPlaceholder large media={mainRole === "mouth_video" ? mouthVideo : illustration} role={mainRole === "mouth_video" ? "mouth_video" : "illustration"} />
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
          onPress={playAudio}
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

function resolveMainRole(
  activeRole: ActiveMediaRole,
  hasRenderableIllustration: boolean,
  playableVideoUri: string | null,
  playableAudioUri: string | null
): ActiveMediaRole {
  if (activeRole === "mouth_video" && playableVideoUri) {
    return "mouth_video";
  }

  if (activeRole === "pronunciation_audio" && playableAudioUri) {
    return "pronunciation_audio";
  }

  if (hasRenderableIllustration) {
    return "illustration";
  }

  if (playableVideoUri) {
    return "mouth_video";
  }

  return activeRole;
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
  playOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(125, 86, 45, 0.58)",
    borderRadius: radii.full,
    height: 64,
    justifyContent: "center",
    left: "50%",
    marginLeft: -32,
    marginTop: -32,
    position: "absolute",
    top: "50%",
    width: 64
  },
  audioStage: {
    alignItems: "center",
    aspectRatio: 1.15,
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 230,
    padding: 20
  },
  audioTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
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
