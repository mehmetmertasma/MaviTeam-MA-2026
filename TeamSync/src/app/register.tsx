import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { Typography, theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { emailVerificationService } from "@/services/emailVerificationService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

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
        legalConsentPrefix: "",
        legalPrivacyLabel: "Gizlilik Politikası'nı",
        legalAnd: " ve ",
        legalTermsLabel: "Kullanım Koşulları'nı",
        legalConsentSuffix: " okudum ve kabul ediyorum.",
        legalConsentRequired: "Devam etmek için Gizlilik Politikası ve Kullanım Koşulları'nı kabul etmelisiniz.",
      }
    : {
        accountSetupTitle: "Secure account setup",
        accountSetupText: "After creating your account, you can create a club workspace or join an existing club with an invite code.",
        creatingAccount: "Creating account...",
        preparingProfile: "Preparing account profile...",
        readyForNextStep: "Account created. Moving to the next step...",
        legalConsentPrefix: "I have read and agree to the ",
        legalPrivacyLabel: "Privacy Policy",
        legalAnd: " and ",
        legalTermsLabel: "Terms of Service",
        legalConsentSuffix: ".",
        legalConsentRequired: "Please accept the Privacy Policy and Terms of Service to continue.",
      };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      setStatusMessage(registerCopy.legalConsentRequired);
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

      // Best-effort: this only matters if the user closes the app before
      // verifying and comes back through /login later instead of
      // continuing this same session, so a failure here shouldn't block
      // the normal path (which already carries "next" via route params).
      try {
        await firestoreTeamSyncService.recordRegistrationIntent(
          user,
          nextRoute === "/join-club" ? "join-club" : "create-club"
        );
      } catch (intentError) {
        console.warn("Recording registration intent failed; /login will default to create-club later.", intentError);
      }

      // The account already exists and is signed in at this point, so even
      // if requesting the code fails (a flaky Cloud Function call), we
      // still need to land on /verify-email with the *correct* next
      // destination rather than get stuck here -- verify-email.tsx already
      // requests a fresh code itself whenever it wasn't handed one directly.
      let challenge: { expiresAt: string; devCode?: string } | null = null;

      try {
        challenge = await emailVerificationService.requestCode({ fullName: trimmedName });
      } catch (codeRequestError) {
        console.warn("Initial verification code request failed; verify-email will retry.", codeRequestError);
      }

      setStatusMessage(registerCopy.readyForNextStep);

      router.replace({
        pathname: "/verify-email",
        params: {
          fullName: user.displayName ?? trimmedName,
          email: user.email ?? trimmedEmail,
          next: nextRoute === "/join-club" ? "join-club" : "create-club",
          ...(challenge ? { expiresAt: challenge.expiresAt } : {}),
          ...(challenge?.devCode ? { devCode: challenge.devCode } : {}),
        },
      } as never);
    } catch (registerError) {
      setStatusMessage(getAuthErrorMessage(registerError, language));
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

        <Pressable
          style={styles.consentRow}
          onPress={() => setAcceptedTerms((currentValue) => !currentValue)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          accessibilityLabel={`${registerCopy.legalConsentPrefix}${registerCopy.legalPrivacyLabel}${registerCopy.legalAnd}${registerCopy.legalTermsLabel}${registerCopy.legalConsentSuffix}`}
        >
          <View style={[styles.checkbox, acceptedTerms ? styles.checkboxChecked : null]}>
            {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>

          <Text style={styles.legalConsentText}>
            {registerCopy.legalConsentPrefix}
            <Text
              style={styles.legalLink}
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                router.push("/privacy-policy" as never);
              }}
            >
              {registerCopy.legalPrivacyLabel}
            </Text>
            {registerCopy.legalAnd}
            <Text
              style={styles.legalLink}
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                router.push("/terms-of-service" as never);
              }}
            >
              {registerCopy.legalTermsLabel}
            </Text>
            {registerCopy.legalConsentSuffix}
          </Text>
        </Pressable>

        <Text style={[styles.statusText, !firebaseIsReady ? styles.warningText : null]}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? t.auth.registerSubmitting : t.auth.registerButton}
            onPress={handleContinue}
            disabled={isSubmitting || !firebaseIsReady || !acceptedTerms}
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
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginTop: theme.spacing["2xl"],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  checkboxMark: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 16,
  },
  legalConsentText: {
    ...Typography.caption,
    color: theme.colors.text.muted,
    flex: 1,
  },
  legalLink: {
    color: theme.colors.text.brand,
    fontWeight: theme.fontWeights.semibold,
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
