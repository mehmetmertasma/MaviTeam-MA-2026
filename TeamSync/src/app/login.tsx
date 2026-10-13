import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { Typography, theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { emailVerificationService } from "@/services/emailVerificationService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function LoginScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const firebaseIsReady = authService.isConfigured();

  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customStatusMessage, setCustomStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState("");

  const defaultStatusMessage = firebaseIsReady ? t.auth.firebaseReadyLogin : t.auth.firebaseMissingLogin;
  const statusMessage = customStatusMessage ?? defaultStatusMessage;

  function clearErrorOnChange() {
    if (error !== "") {
      setError("");
    }
    if (customStatusMessage !== null) {
      setCustomStatusMessage(null);
    }
  }

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(t.auth.validation.firebaseMissing);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.auth.validation.emailInvalid);
      return;
    }

    if (password.trim() === "") {
      setError(t.auth.validation.passwordRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setCustomStatusMessage(t.auth.loginInProgress);

      const user = await authService.loginWithEmail({ email: trimmedEmail, password });

      if (!user.emailVerified) {
        setCustomStatusMessage(t.auth.verificationRequired);

        // Falls back to "create-club" if no intent was ever recorded (e.g.
        // an older account from before this existed) -- matches the
        // previous hardcoded behavior for that case, but now respects a
        // "join-club" intent recorded at registration instead of always
        // overriding it.
        let next: "create-club" | "join-club" = "create-club";

        try {
          next = (await firestoreTeamSyncService.getRegistrationIntent(user)) ?? "create-club";
        } catch (intentError) {
          console.warn("Reading registration intent failed; defaulting to create-club.", intentError);
        }

        const challenge = await emailVerificationService.requestCode({
          fullName: user.displayName ?? trimmedEmail,
        });

        router.replace({
          pathname: "/verify-email",
          params: {
            fullName: user.displayName ?? "",
            email: user.email ?? trimmedEmail,
            next,
            expiresAt: challenge.expiresAt,
            ...(challenge.devCode ? { devCode: challenge.devCode } : {}),
          },
        } as never);
        return;
      }

      setCustomStatusMessage(t.auth.loginSuccess);
      router.replace("/dashboard" as never);
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError, language));
      setCustomStatusMessage(t.auth.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(t.auth.validation.firebaseMissing);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t.auth.validation.resetEmailRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await authService.sendPasswordReset(trimmedEmail);
      setCustomStatusMessage(t.auth.resetLinkSent);
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, language));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
      >
        <ScreenCard style={styles.card}>
          <View style={styles.topHeader}>
            <AppBackButton fallbackHref="/" />
            <Text style={styles.headerLogo}>{t.common.appName}</Text>
            <LanguageSelector compact />
          </View>

          <View style={styles.headingSection}>
            <Text style={styles.title}>{t.auth.loginTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
          </View>

          {customStatusMessage || !firebaseIsReady ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>{t.auth.loginStatusTitle}</Text>
              <Text style={styles.infoText}>{statusMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextField
              label={t.auth.emailLabel}
              placeholder={t.auth.emailPlaceholder}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearErrorOnChange();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel={t.auth.accessibility.email}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />

            <TextField
              ref={passwordInputRef}
              label={t.auth.passwordLabel}
              placeholder={t.auth.passwordPlaceholder}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearErrorOnChange();
              }}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              accessibilityLabel={t.auth.accessibility.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          </View>

          {error !== "" ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonGroup}>
            <AppButton
              title={isSubmitting ? t.auth.loginSubmitting : t.auth.loginButton}
              onPress={handleLogin}
              disabled={isSubmitting || !firebaseIsReady}
              accessibilityLabel={t.auth.accessibility.login}
              style={styles.button}
            />

            <AppButton
              title={t.auth.forgotPassword}
              variant="secondary"
              onPress={handlePasswordReset}
              disabled={isSubmitting || !firebaseIsReady}
              accessibilityLabel={t.auth.accessibility.resetPassword}
              style={styles.button}
            />

            <Link href="/" asChild>
              <AppButton
                title={t.auth.backHome}
                variant="ghost"
                accessibilityLabel={t.auth.accessibility.backHome}
                style={styles.button}
              />
            </Link>
          </View>
        </ScreenCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: theme.colors.background.app },
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  card: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  headerLogo: {
    ...Typography.sectionTitle,
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  headingSection: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  badge: {
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: theme.fontSizes["2xl"],
    lineHeight: theme.lineHeights["2xl"],
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  infoBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoTitle: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xxs,
  },
  infoText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
  },
  form: { width: "100%", gap: theme.spacing.md },
  errorText: {
    ...Typography.supporting,
    marginTop: theme.spacing.sm,
    color: theme.colors.text.danger,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  button: { width: "100%" },
});
