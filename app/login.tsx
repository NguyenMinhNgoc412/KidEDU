import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Input";
import { KidButton } from "@/components/KidButton";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { spacing } from "@/theme";

export default function LoginScreen() {
  const { error, signIn } = useAuth();
  const [email, setEmail] = useState(__DEV__ ? "parent@local.kidedu.test" : "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    try {
      await signIn(email, password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.content}>
        <AppText color="primary" variant="bodyStrong">
          KidEDU
        </AppText>
        <AppText variant="screenTitle">Chào mừng phụ huynh</AppText>
        <AppText color="muted">
          Đăng nhập để xem hồ sơ gia đình và chuẩn bị việc học cùng con.
        </AppText>
        <Card padding="lg" variant="form">
          <AppText variant="cardTitle">Đăng nhập</AppText>
          <TextField
            label="Email"
            accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextField
            label="Mật khẩu"
            accessibilityLabel="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={() => void submit()}
          />
          {error ? (
            <AppText color="danger" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          <KidButton
            label={busy ? "Đang đăng nhập" : "Đăng nhập"}
            onPress={() => void submit()}
            disabled={busy || !email.trim() || !password}
            fullWidth
          />
        </Card>
        {__DEV__ && !process.env.EXPO_PUBLIC_SUPABASE_URL ? (
          <Card padding="lg" variant="subtle">
            <AppText variant="cardTitle">Tài khoản thử local</AppText>
            <AppText variant="labelStrong">Có quyền học</AppText>
            <AppText>Email: fullaccess@local.kidedu.test</AppText>
            <AppText>Mật khẩu: FullAccess123!</AppText>
            <AppText variant="labelStrong">Chưa có gói học</AppText>
            <AppText>Email: parent@local.kidedu.test</AppText>
            <AppText>Mật khẩu: LocalTest123!</AppText>
            <AppText color="muted" variant="caption">
              Chỉ dùng với Docker identity fixture và PostgreSQL local.
            </AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing[16], justifyContent: "center" }
});
