import { useLocalSearchParams, useRouter } from "expo-router";
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

function getNextRoute(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (firstValue === "join-club") {
    return "/join-club";
  }

  return "/create-club";
}

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const firebaseIsReady = authService.isConfigured();
  const registerCopy = language === "tr"
    ? {
        accountSetupTitle: "Güvenli hesap kurulumu",
        accountSetupText: "Hesabınızı oluşturduktan sonra kulübünüzü kurabilir veya davet kodu ile mevcut kulübünüze katılabilirsiniz.",
        creatingAccount: "Hesap oluşturuluyor...",
        preparingProfile: "Hesap profili hazırlanıyor...",
        readyForNextStep: "Hesap oluşturuldu. Sonraki adıma geçiliyor...",
      }
    : {
        accountSetupTitle: "Secure account setup",
        accountSetupText: "After creating your account, you can create a club workspace or join an existing club with an invite code.",
        creatingAccount: "Creating account...",
        preparingProfile: "Preparing account profile...",
        readyForNextStep: "Account created. Moving to the next step...",
      };

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
      setStatusMessage(registerCopy.creatingAccount);

      const user = await authService.registerWithEmail({
        fullName: trimmedName,
        email: trimmedEmail,
        password: cleanPassword,
      });

      setStatusMessage(registerCopy.preparingProfile);
      const challenge = await emailVerificationService.requestCode({ fullName: trimmedName });

      setStatusMessage(registerCopy.readyForNextStep);

      router.replace({
        pathname: "/verify-email",
        params: {
          fullName: user.displayName ?? trimmedName,
          email: user.email ?? trimmedEmail,
          next: nextRoute === "/join-club" ? "join-club" : "create-club",
          expiresAt: challenge.expiresAt,
          ...(challenge.devCode ? { devCode: challenge.devCode } : {}),
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
        <StatusBadge label={t.auth.registerBadge} tone="info" style={styles.badge} />
        <Text style={styles.title}>{t.auth.registerTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>

        <View style={styles.form}>
          <TextField
            label={t.auth.fullNameLabel}
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              clearStatusOnChange();
            }}
            placeholder={t.auth.fullNamePlaceholder}
            autoComplete="name"
            textContentType="name"
            accessibilityLabel={t.auth.accessibility.fullName}
          />

          <TextField
            label={t.auth.emailLabel}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearStatusOnChange();
            }}
            placeholder={t.auth.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel={t.auth.accessibility.email}
          />

          <TextField
            label={t.auth.passwordLabel}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearStatusOnChange();
            }}
            placeholder={t.auth.newPasswordPlaceholder}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel={t.auth.accessibility.password}
          />

          <TextField
            label={t.auth.confirmPasswordLabel}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearStatusOnChange();
            }}
            placeholder={t.auth.confirmPasswordPlaceholder}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel={t.auth.accessibility.confirmPassword}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{registerCopy.accountSetupTitle}</Text>
          <Text style={styles.infoText}>{registerCopy.accountSetupText}</Text>
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
  form: { width: "100%", gap: theme.spacing.lg },
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
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
  },
  statusText: {
    ...Typography.supporting,
    marginTop: theme.spacing.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
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
