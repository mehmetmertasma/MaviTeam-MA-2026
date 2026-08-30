import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { Stack, router, usePathname } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AppGlobalNavigation } from "@/components/AppGlobalNavigation";
import { theme } from "@/constants/theme";
import { usePushNotificationRegistration } from "@/hooks/usePushNotificationRegistration";
import { AppDataProvider } from "@/providers/AppDataProvider";
import { AuthProvider, useAuthContext } from "@/providers/AuthProvider";
import { LanguageProvider, useTranslation } from "@/localization";
import { Sentry, initSentry } from "@/lib/sentry";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

initSentry();

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
// Privacy Policy and Terms of Service are meant to stay readable by anyone,
// signed in or not, with or without a club -- register.tsx and index.tsx
// both link here for anonymous visitors, which is why they're also in
// publicAuthRoutes/workspaceSetupRoutes above. But those two lists are
// reused below for "does this signed-in user already have a workspace,
// send them to /dashboard" -- without this exclusion, a logged-in club
// member tapping either legal link from Profile would get bounced straight
// back to /dashboard a moment after the page opened.
const legalRoutes = ["/privacy-policy", "/terms-of-service"];
// "/login" and "/register" are included here (even though they aren't
// "setup" screens) so that an already-signed-in, verified, clubless user who
// lands back on either one -- e.g. clicking a home-screen button again after
// an earlier attempt -- doesn't get force-redirected to "/create-club" by
// the workspace guard below before they can pick "join a club" again. Both
// are already public auth routes, so this doesn't change how a user who
// already has a club gets bounced to "/dashboard" from either screen.
//
// "/verify-email" is included for the same race-condition reason as
// "/register" is skipped in the effect above, one step later in the flow:
// the moment verifyEmailCode succeeds, user.emailVerified flips true and
// re-renders this component *before* verify-email.tsx's own
// ensureUserProfile()-then-redirect finishes -- so this guard would run
// first, see workspace.club === null, and defer to
// getSetupRouteForSignedInUser(pathname), which only special-cases
// "/join-club"/"/join-request-sent" and defaults everything else (including
// "/verify-email" itself) to "/create-club", clobbering a join-club intent
// regardless of what the user actually chose. Skipping it here leaves the
// redirect entirely to verify-email.tsx's own nextRoute, which already knows
// the real intent via its route params.
const workspaceSetupRoutes = [
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

  usePushNotificationRegistration(user);

  useEffect(() => {
    Sentry.setUser(user === null ? null : { id: user.uid, email: user.email ?? undefined });
  }, [user]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;

      if (typeof route === "string" && route.startsWith("/")) {
        router.push(route as never);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isFirebaseAuthConfigured || !isAuthReady) {
      return;
    }

    if (!isSignedIn && !routeIsPublic) {
      router.replace("/login" as never);
    }
  }, [isAuthReady, isFirebaseAuthConfigured, isSignedIn, routeIsPublic]);

  useEffect(() => {
    // Firebase signs a user in immediately on account creation, before
    // they've verified their email -- which makes this effect's condition
    // true while register.tsx is still on-screen, mid-flow, waiting on its
    // own network call to request the verification code. If this effect
    // redirected here too, it would only have the current pathname
    // ("/register") to guess the right destination from, always guessing
    // "create-club" even when the user chose "join a club" -- clobbering
    // register.tsx's own correct, context-aware redirect if that one is
    // ever slow or fails. Skipping "/register" leaves that transition
    // entirely to register.tsx; this effect still catches everyone else
    // (e.g. a returning user who reopens the app mid-verification).
    if (
      !isFirebaseAuthConfigured
      || !isAuthReady
      || !isSignedIn
      || user === null
      || user.emailVerified
      || pathname === "/verify-email"
      || pathname === "/register"
    ) {
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

        if (workspace.club !== null && !legalRoutes.includes(pathname) && (routeIsPublic || routeIsWorkspaceSetup)) {
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
