import type { PropsWithChildren } from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";

export const unstable_settings = {
  initialRouteName: "index",
};

const APP_BACKGROUND_COLOR = "#0f172a";
const GLOBAL_NAV_TOP_SPACE = 88;

const routesWithoutGlobalNavigation = [
  "/",
  "/login",
  "/create-club",
  "/join-club",
  "/join-request-sent",
];

function AppProviders({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export default function RootLayout() {
  const pathname = usePathname();
  const showGlobalNavigation = !routesWithoutGlobalNavigation.includes(pathname);

  return (
    <AppProviders>
      <View style={{ flex: 1, backgroundColor: APP_BACKGROUND_COLOR }}>
        <StatusBar style="light" />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade_from_bottom",
            contentStyle: {
              backgroundColor: APP_BACKGROUND_COLOR,
              paddingTop: showGlobalNavigation ? GLOBAL_NAV_TOP_SPACE : 0,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
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
    </AppProviders>
  );
}
