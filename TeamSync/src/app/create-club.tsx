import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { Typography, theme } from "@/constants/theme";
import { requireFirebaseServices } from "@/lib/firebase";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { paymentGatewayService } from "@/services/paymentGatewayService";
import { teamSyncService } from "@/services/teamSyncService";
import type { ClubCountry } from "@/types/teamSync";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function generatePreviewCode(clubName: string, fallbackPrefix: string) {
  const prefix = clubName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "")
    .slice(0, 3);

  return `${prefix || fallbackPrefix}${new Date().getFullYear()}`;
}

// idle: filling out the form. submitting: startClubSignup's network call is
// in flight (covers both the instant promo-redemption path and starting a
// paid checkout). waiting: a paid checkout was opened and we're listening on
// its pendingClubSignups doc for the Stripe webhook to confirm payment.
type SignupPhase = "idle" | "submitting" | "waiting";

export default function CreateClubScreen() {
  const router = useRouter();
  const { fullName, email, checkout: checkoutReturnParam, signupId: signupIdParam } = useLocalSearchParams<{
    fullName?: string | string[];
    email?: string | string[];
    checkout?: string;
    signupId?: string | string[];
  }>();
  const { t, language } = useTranslation();
  const { refresh } = useAppDataContext();

  const ownerFullName = getParamValue(fullName);
  const ownerEmail = getParamValue(email);

  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState<ClubCountry>("TR");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<SignupPhase>("idle");

  const isPaidFlow = authService.isConfigured();
  const isSubmitting = phase !== "idle";

  const countryOptions: { label: string; value: ClubCountry }[] = [
    { label: t.createClub.countryTurkey, value: "TR" },
    { label: t.createClub.countryUnitedStates, value: "US" },
  ];

  const previewCode = generatePreviewCode(clubName, t.createClub.defaultCodePrefix);

  // Paid checkout returns here via the maviteam://create-club?checkout=...
  // deep link (see functions/index.js's startClubSignup success_url/
  // cancel_url) -- same pattern payments.tsx uses for its own checkout
  // return. "return" means Stripe redirected back after a completed
  // checkout, so we listen on the matching pendingClubSignups doc for the
  // webhook to actually finish creating the club; "cancel" just means the
  // user backed out, so the form is simply re-enabled.
  useFocusEffect(
    useCallback(() => {
      if (checkoutReturnParam === "cancel") {
        setPhase("idle");
        return;
      }

      if (checkoutReturnParam !== "return") {
        return;
      }

      const signupId = getParamValue(signupIdParam);

      if (signupId === "") {
        return;
      }

      setPhase("waiting");
      setError("");

      const { db } = requireFirebaseServices();
      const unsubscribe = onSnapshot(
        doc(db, "pendingClubSignups", signupId),
        (snapshot) => {
          const data = snapshot.data();

          if (!data) {
            return;
          }

          if (data.status === "completed" && data.resultClubId) {
            // useAppDataContext's cache was seeded (no club yet) the moment
            // this screen mounted and never invalidated since -- without
            // refreshing it first, /dashboard would render from that stale
            // "no club" snapshot even though _layout.tsx's own guard (which
            // reads Firestore directly, not the cache) correctly lets the
            // navigation through.
            refresh()
              .catch(() => {})
              .then(() => router.replace("/dashboard"));
          } else if (data.status === "failed") {
            setPhase("idle");
            setError(t.createClub.validation.signupFailed);
          }
        },
        () => {
          setPhase("idle");
          setError(t.createClub.validation.checkoutFailed);
        }
      );

      return unsubscribe;
    }, [
      checkoutReturnParam,
      signupIdParam,
      router,
      refresh,
      t.createClub.validation.signupFailed,
      t.createClub.validation.checkoutFailed,
    ])
  );

  async function handleCreateClub() {
    const trimmedClubName = clubName.trim();
    const trimmedSport = sport.trim();
    const trimmedCity = city.trim();

    if (trimmedClubName === "") {
      setError(t.createClub.validation.clubNameRequired);
      return;
    }

    if (trimmedSport === "") {
      setError(t.createClub.validation.sportRequired);
      return;
    }

    if (trimmedCity === "") {
      setError(t.createClub.validation.cityRequired);
      return;
    }

    const firebaseUser = authService.getCurrentUser();

    if (authService.isConfigured() && firebaseUser === null) {
      setError(t.createClub.validation.loginRequired);
      return;
    }

    if (authService.isConfigured() && firebaseUser !== null && !firebaseUser.emailVerified) {
      setError(t.createClub.validation.emailVerificationRequired);
      return;
    }

    try {
      setPhase("submitting");
      setError("");

      if (!authService.isConfigured() || firebaseUser === null) {
        // Offline/demo mode has no backend and no billing -- unchanged.
        await teamSyncService.createClubWorkspace({
          ownerFullName: ownerFullName || firebaseUser?.displayName || t.createClub.ownerFallbackName,
          ownerEmail: ownerEmail || firebaseUser?.email || t.createClub.ownerFallbackEmail,
          clubName: trimmedClubName,
          sport: trimmedSport,
          city: trimmedCity,
          country,
        });

        router.replace("/dashboard");
        return;
      }

      // The real club is now only ever created server-side, once payment or
      // a promo code is confirmed -- see functions/index.js's
      // startClubSignup. It either creates the club immediately (promo
      // code) or returns a checkout to open (paid path), in which case the
      // useFocusEffect above takes over once the browser redirects back.
      const result = await paymentGatewayService.startClubSignup(
        { name: trimmedClubName, sport: trimmedSport, city: trimmedCity, country },
        promoCode.trim()
      );

      // typeof narrowing (not plain truthiness) is what actually
      // discriminates this union for TS -- clubId is typed as a bare
      // string on the "created" branch, not a literal, so a truthy check
      // alone can't rule that branch out for the code below.
      if (typeof result.clubId === "string") {
        // Same staleness issue as the checkout-return branch above -- the
        // app-wide data cache still thinks this account has no club until
        // explicitly refreshed.
        await refresh().catch(() => {});
        router.replace("/dashboard");
        return;
      }

      setPhase("waiting");
      await openBrowserAsync(result.checkoutUrl);
    } catch (createClubError) {
      setPhase("idle");
      setError(getAuthErrorMessage(createClubError, language));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenCard style={styles.card}>
          <AppBackButton fallbackHref="/" />

          <Text style={styles.logo}>{t.common.appName}</Text>

          <StatusBadge label={t.createClub.badge} tone="info" style={styles.badge} />

          <Text style={styles.title}>{t.createClub.title}</Text>

          <Text style={styles.subtitle}>{t.createClub.subtitle}</Text>

          {phase === "waiting" ? (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingTitle}>{t.createClub.waitingForPaymentTitle}</Text>
              <Text style={styles.waitingSubtitle}>{t.createClub.waitingForPaymentSubtitle}</Text>
            </View>
          ) : (
            <>
              <View style={styles.ownerBox}>
                <Text style={styles.ownerLabel}>{t.createClub.ownerInfoTitle}</Text>
                <Text style={styles.ownerText}>{ownerFullName || t.createClub.ownerNameFallback}</Text>
                <Text style={styles.ownerText}>{ownerEmail || t.createClub.ownerEmailFallback}</Text>
              </View>

              <View style={styles.form}>
                <TextField
                  label={t.createClub.clubNameLabel}
                  placeholder={t.createClub.clubNamePlaceholder}
                  value={clubName}
                  onChangeText={setClubName}
                  accessibilityLabel={t.createClub.accessibility.clubName}
                />

                <TextField
                  label={t.createClub.sportLabel}
                  placeholder={t.createClub.sportPlaceholder}
                  value={sport}
                  onChangeText={setSport}
                  accessibilityLabel={t.createClub.accessibility.sport}
                />

                <TextField
                  label={t.createClub.cityLabel}
                  placeholder={t.createClub.cityPlaceholder}
                  value={city}
                  onChangeText={setCity}
                  accessibilityLabel={t.createClub.accessibility.city}
                />

                <View>
                  <Text style={styles.countryLabel}>{t.createClub.countryLabel}</Text>
                  <View style={styles.countryRow}>
                    {countryOptions.map((option) => {
                      const isSelected = option.value === country;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setCountry(option.value)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          style={({ pressed }) => [
                            styles.countryOption,
                            isSelected ? styles.countryOptionSelected : null,
                            pressed && !isSelected ? styles.pressed : null,
                          ]}
                        >
                          <Text style={[styles.countryOptionText, isSelected ? styles.countryOptionTextSelected : null]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.countryHint}>{t.createClub.countryHint}</Text>
                </View>

                {isPaidFlow && (
                  <View>
                    <TextField
                      label={t.createClub.promoCodeLabel}
                      placeholder={t.createClub.promoCodePlaceholder}
                      value={promoCode}
                      onChangeText={(value) => setPromoCode(value.toUpperCase())}
                      autoCapitalize="characters"
                      accessibilityLabel={t.createClub.accessibility.promoCode}
                    />
                    <Text style={styles.countryHint}>{t.createClub.promoCodeHint}</Text>
                  </View>
                )}
              </View>

              <View style={styles.codePreviewBox}>
                <Text style={styles.codePreviewLabel}>{t.createClub.invitationCodePreview}</Text>
                <Text style={styles.codePreviewValue}>{previewCode}</Text>
                <Text style={styles.codePreviewHint}>{t.createClub.invitationCodeHint}</Text>
              </View>
            </>
          )}

          {error !== "" && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonGroup}>
            <AppButton
              title={
                phase === "waiting"
                  ? t.createClub.openingCheckoutButton
                  : phase === "submitting"
                    ? t.createClub.submittingButton
                    : isPaidFlow
                      ? promoCode.trim() !== ""
                        ? t.createClub.submitButtonPromo
                        : t.createClub.submitButtonPaid
                      : t.createClub.submitButton
              }
              onPress={handleCreateClub}
              disabled={isSubmitting}
              accessibilityLabel={t.createClub.accessibility.submit}
              style={styles.button}
            />

            {phase !== "waiting" && (
              <Link href="/" asChild>
                <AppButton
                  title={t.createClub.backHome}
                  variant="ghost"
                  accessibilityLabel={t.createClub.accessibility.backHome}
                  style={styles.button}
                />
              </Link>
            )}
          </View>
        </ScreenCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
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
  waitingBox: {
    width: "100%",
    backgroundColor: theme.colors.state.infoSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  waitingTitle: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  waitingSubtitle: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  ownerBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  ownerLabel: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ownerText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
  },
  form: { width: "100%", gap: theme.spacing.lg },
  countryLabel: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  countryRow: { flexDirection: "row", gap: theme.spacing.sm },
  countryOption: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.subtle,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  countryOptionSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  countryOptionText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  countryOptionTextSelected: { color: theme.colors.text.inverse },
  countryHint: {
    ...Typography.caption,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  pressed: { opacity: 0.84 },
  codePreviewBox: {
    width: "100%",
    backgroundColor: theme.colors.state.infoSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  codePreviewLabel: {
    ...Typography.caption,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  codePreviewValue: {
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  codePreviewHint: {
    ...Typography.caption,
    color: theme.colors.text.secondary,
  },
  errorText: {
    ...Typography.supporting,
    marginTop: theme.spacing.lg,
    color: theme.colors.text.danger,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});
