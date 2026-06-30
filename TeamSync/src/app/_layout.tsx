import type { PropsWithChildren } from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";
import { AuthProvider } from "@/providers/AuthProvider";

export const unstable_settings = {
  initialRouteName: "index",
};

const APP_BACKGROUND_COLOR = "#0f172a";
const GLOBAL_NAV_TOP_OFFSET = 10;
const GLOBAL_NAV_HEIGHT = 44;
const GLOBAL_NAV_BOTTOM_GAP = 14;

const routesWithoutGlobalNavigation = [
  "/",
  "/login",
  "/register",
  "/create-club",
  "/join-club",
  "/join-request-sent",
];

function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AuthProvider>{children}</AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const showGlobalNavigation = !routesWithoutGlobalNavigation.includes(pathname);
  const globalNavigationTopSpace = showGlobalNavigation
    ? insets.top + GLOBAL_NAV_TOP_OFFSET + GLOBAL_NAV_HEIGHT + GLOBAL_NAV_BOTTOM_GAP
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: APP_BACKGROUND_COLOR }}>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: {
            backgroundColor: APP_BACKGROUND_COLOR,
            paddingTop: globalNavigationTopSpace,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="create-club" />
        <Stack.Screen name="join-club" />
        <Stack.Screen name="join-request-sent" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="pending-approvals" />
        <Stack.Screen name="teams" />
        <Stack.Screen name="announcements" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="availability" />
        <Stack.Screen name="statistics" />
        <Stack.Screen name="replays" />
        <Stack.Screen name="payments" />
      </Stack>

      <AppGlobalNavigation />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
