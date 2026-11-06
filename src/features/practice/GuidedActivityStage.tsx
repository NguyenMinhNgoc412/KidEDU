import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { KidButton } from "@/components/KidButton";
import type { ActivityV1 } from "@/content/contracts/activity";
import { illustrationAnimations } from "@/data/illustrationAnimations";
import { SemanticIllustration } from "@/features/learning/SemanticIllustration";
import { colors } from "@/theme";
const noMotion = () => {};

/** Interaction is an opportunity, never an automatic ability assessment. */
export function GuidedActivityStage({
  activity,
  paused
}: {
  activity: ActivityV1;
  paused: boolean;
}) {
  const [selection, setSelection] = useState<string | null>(null);
  useEffect(() => setSelection(null), [activity.id]);
  if (activity.type === "command")
    return (
      <Card padding="lg" variant="subtle">
        <AppText variant="cardTitle">Cùng làm với đồ thật</AppText>
        {activity.stimulus.orderedActions.map((action, index) => (
          <View key={action} style={styles.row}>
            <View style={styles.number}>
              <AppText color="primary" variant="labelStrong">
                {index + 1}
              </AppText>
            </View>
            <AppText>{action}</AppText>
          </View>
        ))}
        <AppText color="muted">
          Để con nghe rồi thực hiện. Người lớn quan sát; không cần bấm hoàn thành từng động tác.
        </AppText>
      </Card>
    );
  if (activity.type === "parent_transfer")
    return (
      <Card padding="lg" variant="subtle">
        <AppText variant="sectionTitle">Bây giờ, cùng rời màn hình</AppText>
        <AppText>{activity.stimulus.preparation}</AppText>
        <AppText>{activity.stimulus.parentAction}</AppText>
        <AppText color="muted">{activity.transfer.observationHint}</AppText>
      </Card>
    );
  if (activity.type !== "functional_communication") return null;
  if (activity.stimulus.scenario === "choice")
    return (
      <Card padding="lg" variant="subtle">
        <AppText variant="sectionTitle" align="center">
          Con thích chơi gì?
        </AppText>
        <View style={styles.choices}>
          {[
            { id: "ball", item: "item-bong", label: "Bóng" },
            { id: "bear", item: "item-gau", label: "Gấu" }
          ].map((option) => (
            <View key={option.id} style={styles.choice}>
              <SemanticIllustration
                animation={illustrationAnimations[option.item]!}
                size={96}
                paused
                disabled
                onComplete={noMotion}
                onReplay={noMotion}
                fallback={<AppText>{option.label}</AppText>}
              />
              <KidButton
                label={option.label}
                selected={selection === option.id}
                disabled={paused}
                variant="secondary"
                onPress={() => setSelection(option.id)}
              />
            </View>
          ))}
        </View>
        {selection ? (
          <AppText align="center">Cùng chơi với món con chọn nhé.</AppText>
        ) : (
          <AppText align="center" color="muted">
            Con có thể nói, chỉ hoặc chọn.
          </AppText>
        )}
      </Card>
    );
  if (activity.stimulus.scenario === "refusal")
    return (
      <Card padding="lg" variant="subtle">
        <AppText variant="sectionTitle" align="center">
          Mình chơi cùng nhau nhé?
        </AppText>
        <KidButton
          label="Con muốn chơi"
          selected={selection === "yes"}
          disabled={paused}
          variant="secondary"
          onPress={() => setSelection("yes")}
        />
        <KidButton
          label="Con chưa muốn"
          selected={selection === "no"}
          disabled={paused}
          variant="secondary"
          onPress={() => setSelection("no")}
        />
        {selection ? (
          <AppText align="center">
            {selection === "no" ? "Mình nghỉ nhé. Cảm ơn con đã cho biết." : "Mình cùng chơi nhé."}
          </AppText>
        ) : null}
      </Card>
    );
  return (
    <Card padding="lg" variant="subtle">
      <AppText variant="cardTitle">Một cơ hội cho con bày tỏ</AppText>
      <AppText>{activity.stimulus.opportunity}</AppText>
      <AppText color="muted">{activity.stimulus.naturalConsequence}</AppText>
    </Card>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  number: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  choices: { flexDirection: "row", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  choice: { minWidth: 112, alignItems: "center", gap: 12, flex: 1 }
});
