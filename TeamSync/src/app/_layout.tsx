import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";
import { AuthProvider, useAuthContext } from "@/providers/AuthProvider";
import { LanguageProvider, useTranslation } from "@/localization";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

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
  "/verify-email",
  "/create-club",
  "/join-club",
  "/join-request-sent",
];

const publicAuthRoutes = ["/", "/login", "/register", "/verify-email"];
const workspaceSetupRoutes = ["/", "/create-club", "/join-club", "/join-request-sent"];

function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: APP_BACKGROUND_COLOR, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <StatusBar style="light" />
      <Text style={{ color: "white", fontSize: 20, fontWeight: "900", marginBottom: 8 }}>MaviTeam</Text>
      <Text style={{ color: "#cbd5e1", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}

function getSetupRouteForSignedInUser(pathname: string) {
  if (pathname === "/join-club" || pathname === "/join-request-sent") {
    return pathname;
  }

  return "/create-club";
}

function AppContent() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t, isLanguageReady } = useTranslation();
  const { user, isAuthReady, isFirebaseAuthConfigured, isSignedIn } = useAuthContext();
  const routeIsPublic = publicAuthRoutes.includes(pathname);
  const showGlobalNavigation = !routesWithoutGlobalNavigation.includes(pathname);
  const globalNavigationTopSpace = showGlobalNavigation
    ? insets.top + GLOBAL_NAV_TOP_OFFSET + GLOBAL_NAV_HEIGHT + GLOBAL_NAV_BOTTOM_GAP
    : 0;

  useEffect(() => {
    if (!isFirebaseAuthConfigured || !isAuthReady) {
      return;
    }

    if (!isSignedIn && !routeIsPublic) {
      router.replace("/login" as never);
      return;
    }

    if (isSignedIn && pathname === "/login") {
      router.replace("/dashboard" as never);
    }
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, pathname, routeIsPublic]);

  useEffect(() => {
    if (!isFirebaseAuthConfigured || !isAuthReady || !isSignedIn || user === null) {
      return;
    }

    const firebaseUser = user;
    let isActive = true;

    async function guardWorkspaceAccess() {
      try {
        const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

        if (!isActive) {
          return;
        }

        if (workspace === null) {
          if (!workspaceSetupRoutes.includes(pathname)) {
            router.replace(getSetupRouteForSignedInUser(pathname) as never);
          }

          return;
        }

        const userHasClub = workspace.currentUser.clubId !== "";
        const userIsPendingApproval = workspace.currentUser.status === "pending" && userHasClub;
        const userWasRemoved = workspace.currentUser.status === "removed";

        if (userWasRemoved && pathname !== "/") {
          router.replace("/" as never);
          return;
        }

        if (userIsPendingApproval && pathname !== "/join-request-sent" && pathname !== "/join-club") {
          router.replace("/join-request-sent" as never);
          return;
        }

        if (workspace.club === null && !workspaceSetupRoutes.includes(pathname)) {
          router.replace(getSetupRouteForSignedInUser(pathname) as never);
        }
      } catch {
        if (isActive && !workspaceSetupRoutes.includes(pathname)) {
          router.replace(getSetupRouteForSignedInUser(pathname) as never);
        }
      }
    }

    guardWorkspaceAccess();

    return () => {
      isActive = false;
    };
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, pathname, user]);

  if (!isLanguageReady) {
    return <LoadingScreen message={t.common.loading} />;
  }

  if (isFirebaseAuthConfigured && !isAuthReady && !routeIsPublic) {
    return <LoadingScreen message={t.common.loading} />;
  }

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
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="create-club" />
        <Stack.Screen name="join-club" />
        <Stack.Screen name="join-request-sent" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="pending-approvals" />
        <Stack.Screen name="members" />
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
