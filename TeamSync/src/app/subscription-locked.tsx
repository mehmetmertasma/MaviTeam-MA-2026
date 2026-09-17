import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Typography, theme } from "@/constants/theme";
import { requireFirebaseServices } from "@/lib/firebase";
import { useTranslation } from "@/localization";
import { useAuthContext } from "@/providers/AuthProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { paymentGatewayService } from "@/services/paymentGatewayService";
import type { Club, UserProfile } from "@/types/teamSync";

// Deliberately does NOT go through useAppDataContext/useAppData: that hook
// fetches the FULL workspace (teams, payments, chat, etc.), all of which
// stay permission-denied for a suspended club and would leave appData stuck
// on stale cache or null. This screen only ever needs the bare club +
// current-user profile, which firestore.rules specifically keeps readable
// for any active member even while suspended (see
// currentUserClubMembershipRegardlessOfSuspension) -- the same lightweight
// call _layout.tsx's own workspace guard uses.
export default function SubscriptionLockedScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { user } = useAuthContext();

  const [club, setClub] = useState<Club | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  // Mirrors _layout.tsx's own guardWorkspaceAccess effect: an isActive flag
  // guards every setState call so nothing fires after this screen unmounts
  // (e.g. the workspace guard itself already redirected away once the
  // fetch resolves).
  useEffect(() => {
    if (user === null) {
      // Only reachable if the user signs out while this screen is still
      // mounted (see handleSignOut) -- not a "fetch on mount" state update,
      // just clearing the spinner for a state this screen is about to
      // navigate away from anyway.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const firebaseUser = user;

    (async () => {
      try {
        const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

        if (!isActive) {
          return;
        }

        setClub(workspace?.club ?? null);
        setCurrentUser(workspace?.currentUser ?? null);
      } catch (loadError) {
        if (isActive) {
          setError(getAuthErrorMessage(loadError, language) || t.subscriptionLocked.loadError);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user, language, t.subscriptionLocked.loadError]);

  // Cleared on unmount and at the start of every new renewal attempt --
  // otherwise a stale listener from an earlier attempt could still be
  // running if the user backs out and taps "Renew" again.
  const unsubscribeRenewalListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      unsubscribeRenewalListenerRef.current?.();
    };
  }, []);

  async function handleRenew() {
    if (club === null || isRenewing) {
      return;
    }

    unsubscribeRenewalListenerRef.current?.();

    try {
      setIsRenewing(true);
      setError("");

      const { checkoutUrl } = await paymentGatewayService.startSubscriptionRenewalCheckout(club.id);
      const clubId = club.id;

      await openBrowserAsync(checkoutUrl);

      // The webhook that actually flips clubs/{clubId}.status back to
      // "active" fires asynchronously, some time after the browser closes --
      // listening here (rather than a single reload) is what lets this
      // screen pick that up whenever it lands, instead of only on the next
      // manual refresh. currentUserClubMembershipRegardlessOfSuspension in
      // firestore.rules is what makes this club doc still readable while
      // suspended.
      const { db } = requireFirebaseServices();
      unsubscribeRenewalListenerRef.current = onSnapshot(doc(db, "clubs", clubId), (snapshot) => {
        const data = snapshot.data();

        if (data && data.status !== "suspended") {
          unsubscribeRenewalListenerRef.current?.();
          router.replace("/dashboard" as never);
        }
      });
    } catch (renewError) {
      setError(getAuthErrorMessage(renewError, language));
    } finally {
      setIsRenewing(false);
    }
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);

      if (authService.isConfigured()) {
        await authService.logout();
      }

      router.replace("/login" as never);
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError, language));
      setIsSigningOut(false);
    }
  }

  const isClubAdmin = currentUser?.role === "clubAdmin";
  const subscription = club?.subscription;

  const title =
    subscription?.status === "canceled"
      ? t.subscriptionLocked.canceledTitle
      : subscription?.promoCodeId
        ? t.subscriptionLocked.trialEndedTitle
        : subscription?.status === "past_due"
          ? t.subscriptionLocked.pastDueTitle
          : t.subscriptionLocked.genericTitle;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>{t.common.appName}</Text>

        <StatusBadge label={t.subscriptionLocked.badge} tone="danger" style={styles.badge} />

        {isLoading ? (
          <Text style={styles.subtitle}>{t.common.continue}...</Text>
        ) : (
          <>
            {club?.name && <Text style={styles.clubName}>{club.name}</Text>}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {isClubAdmin ? t.subscriptionLocked.adminSubtitle : t.subscriptionLocked.nonAdminSubtitle}
            </Text>

            {error !== "" && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonGroup}>
              {isClubAdmin && (
                <AppButton
                  title={isRenewing ? t.subscriptionLocked.renewingButton : t.subscriptionLocked.renewButton}
                  onPress={handleRenew}
                  disabled={isRenewing}
                  style={styles.button}
                />
              )}

              <AppButton
                title={t.subscriptionLocked.logoutButton}
                variant="ghost"
                onPress={handleSignOut}
                disabled={isSigningOut}
                style={styles.button}
              />
            </View>
          </>
        )}
      </ScreenCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  card: {
    padding: theme.spacing["3xl"],
  },
  logo: {
    ...Typography.sectionTitle,
    color: theme.colors.brand.primary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  badge: {
    alignSelf: "center",
    marginBottom: theme.spacing["2xl"],
  },
  clubName: {
    ...Typography.label,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...Typography.pageTitle,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  errorText: {
    ...Typography.supporting,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.danger,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
  },
  button: { width: "100%" },
});
