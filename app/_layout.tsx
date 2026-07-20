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
        <Stack screenOptions={{ headerShown: false }} />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
