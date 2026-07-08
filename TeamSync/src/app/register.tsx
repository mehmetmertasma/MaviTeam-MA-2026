import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";

function getNextRoute(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (firstValue === "join-club") {
    return "join-club";
  }

  return "create-club";
}

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { t } = useTranslation();
  const firebaseIsReady = authService.isConfigured();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    firebaseIsReady ? t.auth.firebaseReadyRegister : t.auth.firebaseMissingRegister
  );

  function clearStatusOnChange() {
    if (firebaseIsReady && statusMessage !== t.auth.firebaseReadyRegister) {
      setStatusMessage(t.auth.firebaseReadyRegister);
    }
  }

  async function handleContinue() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const nextRoute = getNextRoute(next);

    if (!firebaseIsReady) {
      setStatusMessage(t.auth.validation.firebaseMissing);
      return;
    }

    if (trimmedName === "") {
      setStatusMessage(t.auth.validation.fullNameRequired);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatusMessage(t.auth.validation.emailInvalidExample);
      return;
    }

    if (cleanPassword.length < 6) {
      setStatusMessage(t.auth.validation.passwordTooShort);
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setStatusMessage(t.auth.validation.passwordMismatch);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(t.auth.registerInProgress);

      const user = await authService.registerWithEmail({
        fullName: trimmedName,
        email: trimmedEmail,
        password: cleanPassword,
      });

      setStatusMessage(t.auth.verificationEmailSent);

      router.replace({
        pathname: "/verify-email",
        params: {
          fullName: user.displayName ?? trimmedName,
          email: user.email ?? trimmedEmail,
          next: nextRoute,
        },
      } as never);
    } catch (registerError) {
      setStatusMessage(getAuthErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />

        <Text style={styles.logo}>{t.common.appName}</Text>
        <Text style={styles.badge}>{t.auth.registerBadge}</Text>
        <Text style={styles.title}>{t.auth.registerTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.fullNameLabel}</Text>
            <TextInput
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                clearStatusOnChange();
              }}
              placeholder={t.auth.fullNamePlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              style={styles.input}
              autoComplete="name"
              textContentType="name"
              accessibilityLabel={t.auth.accessibility.fullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearStatusOnChange();
              }}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              style={styles.input}
              accessibilityLabel={t.auth.accessibility.email}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.passwordLabel}</Text>
            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearStatusOnChange();
              }}
              placeholder={t.auth.newPasswordPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={styles.input}
              accessibilityLabel={t.auth.accessibility.password}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.auth.confirmPasswordLabel}</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearStatusOnChange();
              }}
              placeholder={t.auth.confirmPasswordPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              style={styles.input}
              accessibilityLabel={t.auth.accessibility.confirmPassword}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.auth.emailVerificationRequiredTitle}</Text>
          <Text style={styles.infoText}>{t.auth.emailVerificationRequiredText}</Text>
        </View>

        <Text style={[styles.statusText, !firebaseIsReady ? styles.warningText : null]}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? t.auth.registerSubmitting : t.auth.registerButton}
            onPress={handleContinue}
            disabled={isSubmitting || !firebaseIsReady}
            accessibilityLabel={t.auth.accessibility.register}
            style={styles.button}
          />

          <AppButton
            title={t.auth.backHome}
            variant="ghost"
            onPress={() => router.replace("/")}
            accessibilityLabel={t.auth.accessibility.backHome}
            style={styles.button}
          />
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
  form: { width: "100%", gap: theme.spacing.lg },
  inputGroup: { width: "100%" },
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
  infoBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing["2xl"],
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
  statusText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    lineHeight: theme.lineHeights.md,
  },
  warningText: {
    color: theme.colors.text.danger,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});
