import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { emailVerificationService } from "@/services/emailVerificationService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";

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
      const refreshedUser = await authService.refreshCurrentUser();
      const displayName = user.displayName?.trim();

      if (!refreshedUser.emailVerified) {
        setStatusMessage("Email henüz doğrulanmamış. Yeni doğrulama kodu gönderiliyor...");
        const challenge = await emailVerificationService.requestCode({ fullName: displayName || "" });

        router.replace({
          pathname: "/verify-email",
          params: {
            fullName: displayName || "",
            email: user.email ?? trimmedEmail,
            next: "create-club",
            expiresAt: challenge.expiresAt,
            ...(challenge.devCode ? { devCode: challenge.devCode } : {}),
          },
        } as never);
        return;
      }

      await firestoreTeamSyncService.ensureUserProfile({
        user: refreshedUser,
        role: "clubAdmin",
        status: "emailVerified",
      });

      await teamSyncService.updateCurrentUser({
        email: user.email ?? trimmedEmail,
        status: "active",
        ...(displayName ? { fullName: displayName } : {}),
      });

      setStatusMessage(t.auth.loginSuccess);
      router.replace("/dashboard");
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
        <Text style={styles.badge}>{t.auth.loginBadge}</Text>

        <Text style={styles.title}>{t.auth.loginTitle}</Text>

        <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.auth.loginBadge}</Text>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.emailLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.passwordLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
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
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

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
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing["2xl"],
    textAlign: "center",
  },
  title: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.lineHeights.xl,
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
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  form: {
    width: "100%",
    gap: theme.spacing.lg,
  },
  inputGroup: {
    width: "100%",
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.primary,
  },
  errorText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    lineHeight: theme.lineHeights.md,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: {
    width: "100%",
  },
});
