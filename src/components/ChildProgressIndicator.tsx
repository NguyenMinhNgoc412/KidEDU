import { Star } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors, radii, spacing } from "@/theme";

export function ChildProgressIndicator({
  total,
  currentIndex
}: {
  total: number;
  currentIndex: number;
  loopIndex?: number;
  totalLoops?: number | null;
}) {
  if (total <= 1) {
    return null;
  }

  // If there are many cards (e.g. > 8), show capped dots
  const displayCount = Math.min(total, 8);
  const items = Array.from({ length: displayCount }, (_, index) => {
    // Map current index to display index if total > 8
    const itemIndex = total > 8 ? Math.round((index / (displayCount - 1)) * (total - 1)) : index;
    const isCompleted = currentIndex > itemIndex;
    const isCurrent = currentIndex === itemIndex;

    return { id: index, isCompleted, isCurrent };
  });

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <ProgressDot
          key={item.id}
          isCompleted={item.isCompleted}
          isCurrent={item.isCurrent}
        />
      ))}
    </View>
  );
}

function ProgressDot({
  isCompleted,
  isCurrent
}: {
  isCompleted: boolean;
  isCurrent: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCurrent) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCurrent, pulseAnim]);

  if (isCompleted) {
    return (
      <View style={[styles.dot, styles.completedDot]}>
        <Star color={colors.celebrationGold} fill={colors.celebrationGold} size={13} strokeWidth={2} />
      </View>
    );
  }

  if (isCurrent) {
    return (
      <Animated.View
        style={[
          styles.dot,
          styles.currentDot,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Star color={colors.onPrimary} fill={colors.coral} size={15} strokeWidth={2} />
      </Animated.View>
    );
  }

  return <View style={[styles.dot, styles.pendingDot]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[8],
    justifyContent: "center",
    paddingVertical: spacing[4]
  },
  dot: {
    alignItems: "center",
    borderRadius: radii.full,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  completedDot: {
    backgroundColor: colors.starSoft
  },
  currentDot: {
    backgroundColor: colors.secondarySoft,
    elevation: 2,
    shadowColor: colors.coral,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  pendingDot: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.full,
    height: 10,
    width: 10
  }
});
