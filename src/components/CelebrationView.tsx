import { Award, RotateCcw, Sparkles, Star, X } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import { colors, radii, spacing } from "@/theme";

export interface CelebrationViewProps {
  title?: string;
  message?: string;
  totalItems?: number;
  onRestart?: () => void;
  onExit?: () => void;
  restartLabel?: string;
  exitLabel?: string;
}

export function CelebrationView({
  title = "Đã xong bài hôm nay",
  message,
  totalItems,
  onRestart,
  onExit,
  restartLabel = "Học lại",
  exitLabel = "Chọn bài khác"
}: CelebrationViewProps) {
  const detailMessage =
    message ??
    (typeof totalItems === "number" && totalItems > 0
      ? `Đã hoàn thành ${totalItems} lượt luyện hôm nay.`
      : "Cùng con nghỉ một chút và thử lại khi phù hợp.");

  return (
    <Card padding="lg" style={styles.card} variant="form">
      <View style={styles.starStage}>
        <View style={[styles.floatingStar, styles.floatLeft]}>
          <Star color={colors.celebrationGold} fill={colors.starGlow} size={28} strokeWidth={2} />
        </View>

        <View style={[styles.floatingStar, styles.floatRight]}>
          <Sparkles color={colors.coral} size={32} strokeWidth={2.2} />
        </View>

        <View style={[styles.heroBadge]}>
          <View style={styles.heroBadgeGlow}>
            <View style={styles.heroBadgeInner}>
              <Award color={colors.secondary} size={54} strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.textContent}>
        <AppText align="center" color="secondary" style={styles.title} variant="screenTitle">
          {title}
        </AppText>
        <AppText align="center" color="default" style={styles.message} variant="bodyStrong">
          {detailMessage}
        </AppText>
      </View>

      <View style={styles.actions}>
        {onRestart ? (
          <KidButton
            fullWidth
            icon={<RotateCcw color={colors.onPrimary} size={22} />}
            label={restartLabel}
            onPress={onRestart}
            size="lg"
            variant="secondary"
          />
        ) : null}

        {onExit ? (
          <KidButton
            fullWidth
            icon={<X color={colors.primary} size={22} />}
            label={exitLabel}
            onPress={onExit}
            size="md"
            variant="plain"
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.celebrationBg,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
    gap: spacing[20],
    paddingVertical: spacing[28],
    width: "100%"
  },
  starStage: {
    alignItems: "center",
    height: 120,
    justifyContent: "center",
    position: "relative",
    width: "100%"
  },
  heroBadge: {
    alignItems: "center",
    justifyContent: "center"
  },
  heroBadgeGlow: {
    alignItems: "center",
    backgroundColor: colors.starSoft,
    borderColor: colors.yellow,
    borderRadius: radii.full,
    borderWidth: 4,
    elevation: 4,
    height: 104,
    justifyContent: "center",
    shadowColor: colors.coral,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: 104
  },
  heroBadgeInner: {
    alignItems: "center",
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.full,
    height: 80,
    justifyContent: "center",
    width: 80
  },
  floatingStar: {
    position: "absolute",
    top: 12
  },
  floatLeft: {
    left: 28
  },
  floatRight: {
    right: 28
  },
  textContent: {
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    width: "100%"
  },
  title: {
    fontSize: 28,
    lineHeight: 34
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center"
  },
  actions: {
    gap: spacing[12],
    paddingHorizontal: spacing[12],
    width: "100%"
  }
});
