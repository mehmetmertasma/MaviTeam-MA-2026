import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { Typography, theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { emailVerificationService } from "@/services/emailVerificationService";

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const firebaseIsReady = authService.isConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    firebaseIsReady ? t.auth.firebaseReadyLogin : t.auth.firebaseMissingLogin
  );
  const [error, setError] = useState("");

  function clearErrorOnChange() {
    if (error !== "") {
      setError("");
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
      setStatusMessage(t.auth.loginInProgress);

      const user = await authService.loginWithEmail({ email: trimmedEmail, password });

      if (!user.emailVerified) {
        setStatusMessage(t.auth.verificationRequired);
        const challenge = await emailVerificationService.requestCode({
          fullName: user.displayName ?? trimmedEmail,
        });

        router.replace({
          pathname: "/verify-email",
          params: {
            fullName: user.displayName ?? "",
            email: user.email ?? trimmedEmail,
            next: "create-club",
            expiresAt: challenge.expiresAt,
            ...(challenge.devCode ? { devCode: challenge.devCode } : {}),
          },
        } as never);
        return;
      }

      setStatusMessage(t.auth.loginSuccess);
      router.replace("/dashboard" as never);
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
      setStatusMessage(t.auth.loginFailed);
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
      setStatusMessage(t.auth.resetLinkSent);
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />

        <Text style={styles.logo}>{t.common.appName}</Text>
        <StatusBadge label={t.auth.loginBadge} tone="info" style={styles.badge} />
        <Text style={styles.title}>{t.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.auth.loginBadge}</Text>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>

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
          />

          <TextField
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
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  card: { padding: theme.spacing["3xl"] },
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
  infoBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoTitle: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
  },
  form: { width: "100%", gap: theme.spacing.lg },
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
