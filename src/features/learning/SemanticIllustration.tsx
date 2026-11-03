import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import type { IllustrationAnimation } from "@/data/illustrationAnimations";
import { colors, radii, spacing } from "@/theme";

import { useIllustrationPlayback } from "./useIllustrationPlayback";

export function SemanticIllustration({
  size = 156,
  animation,
  paused,
  disabled,
  onComplete,
  onReplay,
  fallback
}: {
  size?: number;
  animation: IllustrationAnimation;
  paused: boolean;
  disabled: boolean;
  onComplete(): void;
  onReplay(): void;
  fallback: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );
  const { frame, playing, replay, stop } = useIllustrationPlayback({
    animation,
    ready,
    paused: paused || !focused,
    onComplete
  });
  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(() => {
      setFailed(true);
      onComplete();
    }, 8000);
    return () => clearTimeout(timer);
  }, [ready, failed, onComplete]);
  if (failed) return fallback;
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={playing ? "Tạm dừng minh hoạ" : "Phát lại minh hoạ"}
        accessibilityHint={animation.label}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: !ready }}
        disabled={disabled || !ready}
        onPress={() => {
          if (playing) stop();
          else {
            onReplay();
            replay();
          }
        }}
      >
        <View style={[styles.frame, { width: size, height: size }]}>
          <Image
            accessibilityLabel={animation.label}
            source={animation.source}
            contentFit="fill"
            cachePolicy="memory-disk"
            onLoad={() => setReady(true)}
            onError={() => {
              setFailed(true);
              onComplete();
            }}
            style={{
              position: "absolute",
              width: size * 4,
              height: size * 2,
              left: -(frame % 4) * size,
              top: -Math.floor(frame / 4) * size
            }}
          />
        </View>
      </Pressable>
      <AppText color="muted" variant="caption" align="center">
        {playing ? "Chạm để tạm dừng" : disabled ? "Hình minh hoạ" : "Chạm để xem lại"}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing[4] },
  frame: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.surface
  }
});
