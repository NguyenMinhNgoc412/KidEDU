import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme";

import { AppText } from "./AppText";

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.title} variant="sectionTitle">
        {title}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[12],
    justifyContent: "space-between"
  },
  title: {
    flex: 1
  }
});
