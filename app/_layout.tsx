import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { SessionProvider } from "@/lib/SessionContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { NAV_THEME } from "@/theme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
        <ThemeProvider value={NAV_THEME[colorScheme]}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/index" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/review" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/assign" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/settle" options={{ headerShown: false }} />
            <Stack.Screen name="group/[id]/sessions/[sessionId]" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
