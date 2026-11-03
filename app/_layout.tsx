import "react-native-gesture-handler";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppProviders } from "@/providers/AppProviders";
import { useAuth } from "@/features/auth/AuthProvider";
import { useLearningAccess } from "@/features/entitlement/LearningAccessProvider";
import { fontFamilies } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fontFamilies.regular]: PlusJakartaSans_400Regular,
    [fontFamilies.medium]: PlusJakartaSans_500Medium,
    [fontFamilies.semibold]: PlusJakartaSans_600SemiBold,
    [fontFamilies.bold]: PlusJakartaSans_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <StatusBar style="dark" />
        <AuthenticatedStack />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

function AuthenticatedStack() {
  const { ready, session } = useAuth();
  const { status } = useLearningAccess();
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="index" />
        <Stack.Screen name="parent-gate" />
        <Stack.Screen name="parent" />
        <Stack.Screen name="prototype" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && status === "allowed"}>
        <Stack.Screen name="lesson-session" />
        <Stack.Screen name="decks" />
        <Stack.Screen name="category/[categoryId]" />
        <Stack.Screen name="learning/[itemId]" />
        <Stack.Screen name="autoplay/[deckId]" />
        <Stack.Screen name="mini-test/[deckId]" />
      </Stack.Protected>
    </Stack>
  );
}
