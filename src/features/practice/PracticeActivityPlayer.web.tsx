import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { useDisplayMedia } from "@/features/media/useDisplayMediaUri";
import { KidButton } from "@/components/KidButton";
import type { PracticeActivityPlayerProps } from "./practiceActivityPlayer.types";

/** Browser play() promises must be consumed when a lesson is skipped during startup. */
export function PracticeActivityPlayer({
  illustration,
  pronunciationAudio,
  mouthVideo,
  paused,
  autoPlayKey,
  onAutoPlaySampleEnd
}: PracticeActivityPlayerProps) {
  const picture = useDisplayMedia(illustration?.asset.uri ?? null);
  const audio = useDisplayMedia(pronunciationAudio?.asset.uri ?? null);
  const video = useDisplayMedia(mouthVideo?.asset.uri ?? null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(true);
  const callback = useRef(onAutoPlaySampleEnd);
  callback.current = onAutoPlaySampleEnd;
  const completed = useRef<string | null>(null);
  const attempt = useRef(0);
  const [focused, setFocused] = useState(true);
  const [playing, setPlaying] = useState(false);
  pausedRef.current = Boolean(paused || !focused);
  const stop = useCallback(() => {
    attempt.current++;
    audioRef.current?.pause();
    videoRef.current?.pause();
    setPlaying(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        pausedRef.current = true;
        stop();
        setFocused(false);
      };
    }, [stop])
  );
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        pausedRef.current = true;
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stop]);
  function fail() {
    if (!pausedRef.current && autoPlayKey && completed.current !== autoPlayKey) {
      completed.current = autoPlayKey;
      callback.current?.("unavailable");
    }
  }
  async function play(element: HTMLMediaElement | null) {
    if (!element || pausedRef.current || document.visibilityState === "hidden") return;
    const id = ++attempt.current;
    try {
      element.currentTime = 0;
      await element.play();
      if (id === attempt.current && !pausedRef.current) setPlaying(true);
      else element.pause();
    } catch (error) {
      if (
        id !== attempt.current ||
        pausedRef.current ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      fail();
    }
  }
  const playRef = useRef(play);
  playRef.current = play;
  const failRef = useRef(fail);
  failRef.current = fail;
  useEffect(() => {
    if (paused || !focused) {
      stop();
      return;
    }
    if (!autoPlayKey || completed.current === autoPlayKey) return;
    if (
      (mouthVideo && video.status === "resolving") ||
      (pronunciationAudio && audio.status === "resolving")
    )
      return;
    if ((mouthVideo && !video.uri) || (pronunciationAudio && !audio.uri)) {
      failRef.current();
      return;
    }
    if (mouthVideo || pronunciationAudio)
      void playRef.current(mouthVideo ? videoRef.current : audioRef.current);
    return stop;
  }, [
    paused,
    focused,
    autoPlayKey,
    mouthVideo?.asset.uri,
    pronunciationAudio?.asset.uri,
    video.uri,
    video.status,
    audio.uri,
    audio.status,
    stop
  ]);
  function finish() {
    setPlaying(false);
    if (!pausedRef.current && autoPlayKey && completed.current !== autoPlayKey) {
      completed.current = autoPlayKey;
      callback.current?.("played");
    }
  }
  return (
    <View style={{ width: "100%", gap: 12 }}>
      {picture.uri ? (
        <Image
          source={{ uri: picture.uri }}
          style={{ width: "100%", height: 220 }}
          contentFit="contain"
          accessibilityLabel="Hình của bài học"
        />
      ) : null}
      {video.uri ? (
        <video
          ref={videoRef}
          src={video.uri}
          playsInline
          preload="auto"
          style={{ width: "100%", maxHeight: 260, borderRadius: 24 }}
          onError={fail}
          onEnded={() => {
            if (pronunciationAudio) void play(audioRef.current);
            else finish();
          }}
          aria-label="Video khẩu hình"
        />
      ) : null}
      {audio.uri ? (
        <audio ref={audioRef} src={audio.uri} preload="auto" onEnded={finish} onError={fail} />
      ) : null}
      {video.uri || audio.uri ? (
        <KidButton
          label={playing ? "Dừng mẫu" : "Phát lại mẫu"}
          variant="secondary"
          disabled={Boolean(paused)}
          onPress={() => {
            if (playing) stop();
            else void play(video.uri ? videoRef.current : audioRef.current);
          }}
        />
      ) : null}
    </View>
  );
}
