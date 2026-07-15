import { StyleSheet } from "react-native";

import { spacing } from "@/theme";

import { AppText } from "./AppText";
import { Card } from "./Card";

export function StateMessage({ title, message }: { title: string; message?: string }) {
  return (
    <Card style={styles.container} variant="surface">
      <AppText align="center" variant="cardTitle">
        {title}
      </AppText>
      {message ? (
        <AppText align="center" color="muted" variant="body">
          {message}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[8]
  }
});
