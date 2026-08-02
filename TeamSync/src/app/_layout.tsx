import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";
import { theme } from "@/constants/theme";
import { AppDataProvider } from "@/providers/AppDataProvider";
import { AuthProvider, useAuthContext } from "@/providers/AuthProvider";
import { LanguageProvider, useTranslation } from "@/localization";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

export const unstable_settings = {
  initialRouteName: "index",
};

const APP_BACKGROUND_COLOR = theme.colors.background.app;
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
  "/privacy-policy",
  "/terms-of-service",
];

const publicAuthRoutes = ["/", "/login", "/register", "/verify-email", "/privacy-policy", "/terms-of-service"];
const workspaceSetupRoutes = ["/", "/create-club", "/join-club", "/join-request-sent", "/privacy-policy", "/terms-of-service"];

function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: APP_BACKGROUND_COLOR,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing["2xl"],
      }}
    >
      <StatusBar style="light" />
      <Text style={{ color: theme.colors.text.inverse, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.bold, marginBottom: theme.spacing.sm }}>
        MaviTeam
      </Text>
      <Text style={{ color: theme.colors.text.inverse, opacity: 0.72, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, textAlign: "center" }}>
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

function getVerificationNextParam(pathname: string) {
  return pathname === "/join-club" || pathname === "/join-request-sent" ? "join-club" : "create-club";
}

function AppContent() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t, isLanguageReady } = useTranslation();
  const { user, isAuthReady, isFirebaseAuthConfigured, isSignedIn } = useAuthContext();
  const routeIsPublic = publicAuthRoutes.includes(pathname);
  const routeIsWorkspaceSetup = workspaceSetupRoutes.includes(pathname);
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
    }
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, routeIsPublic]);

  useEffect(() => {
    if (!isFirebaseAuthConfigured || !isAuthReady || !isSignedIn || user === null || user.emailVerified || pathname === "/verify-email") {
      return;
    }

    router.replace({
      pathname: "/verify-email",
      params: {
        fullName: user.displayName ?? "",
        email: user.email ?? "",
        next: getVerificationNextParam(pathname),
      },
    } as never);
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, pathname, user]);

  useEffect(() => {
    if (!isFirebaseAuthConfigured || !isAuthReady || !isSignedIn || user === null) {
      return;
    }

    if (!user.emailVerified) {
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
          if (!routeIsWorkspaceSetup) {
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

        if (workspace.club === null && !userHasClub && !routeIsWorkspaceSetup) {
          router.replace(getSetupRouteForSignedInUser(pathname) as never);
          return;
        }

        if (workspace.club !== null && (routeIsPublic || routeIsWorkspaceSetup)) {
          router.replace("/dashboard" as never);
        }
      } catch (workspaceError) {
        console.warn("Workspace guard skipped because workspace data could not be loaded.", workspaceError);
      }
    }

    guardWorkspaceAccess();

    return () => {
      isActive = false;
    };
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, pathname, routeIsPublic, routeIsWorkspaceSetup, user]);

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
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="terms-of-service" />
      </Stack>

      <AppGlobalNavigation />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </AppErrorBoundary>
  );
}
