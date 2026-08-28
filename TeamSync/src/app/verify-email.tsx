import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getNextRoute(value: string | string[] | undefined) {
  const firstValue = getFirstParam(value);

  if (firstValue === "join-club") {
    return "/join-club";
  }

  return "/create-club";
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    logo: "MaviTeam",
    badge: en ? "Code verification" : "Kod doğrulama",
    title: en ? "Enter your verification code" : "Doğrulama kodunu gir",
    subtitle: en
      ? "Enter the 6-digit code sent to your email to secure your MaviTeam account."
      : "MaviTeam hesabını güvenli hale getirmek için email adresine gelen 6 haneli kodu gir.",
    infoTitle: en ? "What to do" : "Ne yapmalısın?",
    infoStep1: en ? "1. Open your inbox." : "1. Mail kutunu aç.",
    infoStep2: en ? "2. Find the MaviTeam verification code." : "2. MaviTeam doğrulama kodunu bul.",
    infoStep3: en
      ? "3. Enter the code below and verify."
      : "3. Kodu aşağıdaki alana yazıp doğrula.",
    codeFieldLabel: en ? "Verification code" : "Doğrulama kodu",
    codePlaceholder: "123456",
    codeFieldAccessibilityLabel: en ? "Verification code" : "Doğrulama kodu",
    checkButton: en ? "Verify code" : "Kodu doğrula",
    checkingButton: en ? "Checking..." : "Kontrol ediliyor...",
    checkButtonAccessibilityLabel: en ? "Check verification code" : "Doğrulama kodunu kontrol et",
    resendButton: en ? "Send new code" : "Yeni kod gönder",
    resendingButton: en ? "Sending new code..." : "Yeni kod gönderiliyor...",
    resendButtonAccessibilityLabel: en ? "Send a new verification code" : "Yeni doğrulama kodu gönder",
    backButton: en ? "Back to login" : "Giriş ekranına dön",
    backButtonAccessibilityLabel: en ? "Back to login" : "Giriş ekranına dön",
    sendingInitialCode: en ? "Sending verification code..." : "Doğrulama kodu gönderiliyor...",
    codeSent: (displayEmail: string) =>
      en
        ? `A 6-digit verification code was sent to ${displayEmail || "your email address"}.`
        : `${displayEmail || "E-posta adresine"} 6 haneli doğrulama kodu gönderildi.`,
    checkSpamSuffix: en ? " Also check your spam/junk folder." : " Spam/Junk klasörünü de kontrol et.",
    developmentCode: (code: string) => (en ? `Development code: ${code}` : `Geliştirme kodu: ${code}`),
    newDevelopmentCode: (code: string) => (en ? `New development code: ${code}` : `Yeni geliştirme kodu: ${code}`),
    newCodeSent: en
      ? "A new verification code was sent to your email address. Also check your spam/junk folder."
      : "Yeni doğrulama kodu email adresine gönderildi. Spam/Junk klasörünü de kontrol et.",
    expirationDefault: en ? "The code is valid for 10 minutes." : "Kod 10 dakika içinde geçerlidir.",
    expirationAt: (time: string) => (en ? `The code is valid until ${time}.` : `Kod ${time} saatine kadar geçerlidir.`),
    enterCodePrompt: en ? "Please enter the 6-digit verification code." : "Lütfen 6 haneli doğrulama kodunu gir.",
    verifying: en ? "Verifying code..." : "Kod doğrulanıyor...",
    verifiedMovingOn: en ? "Code verified. Moving to the next step..." : "Kod doğrulandı. Sonraki adıma geçiliyor...",
    sendingNewCode: en ? "Sending new verification code..." : "Yeni doğrulama kodu gönderiliyor...",
  };
}

function getExpirationText(expiresAt: string, copy: ReturnType<typeof getCopy>) {
  if (!expiresAt) {
    return copy.expirationDefault;
  }

  const expiresDate = new Date(expiresAt);

  if (Number.isNaN(expiresDate.getTime())) {
    return copy.expirationDefault;
  }

  return copy.expirationAt(expiresDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
}

export default function VerifyEmailScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);

  const router = useRouter();
  const { email, fullName, next, expiresAt, devCode } = useLocalSearchParams();
  const nextRoute = getNextRoute(next);
  const displayEmail = getFirstParam(email);
  const displayName = getFirstParam(fullName);
  const expiresAtText = getFirstParam(expiresAt);
  const developmentCode = getFirstParam(devCode);
  const hasChallengeFromRoute = expiresAtText !== "" || developmentCode !== "";

  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    developmentCode
      ? copy.developmentCode(developmentCode)
      : hasChallengeFromRoute
        ? copy.codeSent(displayEmail)
        : copy.sendingInitialCode
  );
  const [expirationMessage, setExpirationMessage] = useState(getExpirationText(expiresAtText, copy));

  const getRequestDisplayName = useCallback(() => {
    return displayName || authService.getCurrentUser()?.displayName || displayEmail || "MaviTeam User";
  }, [displayEmail, displayName]);

  useEffect(() => {
    if (hasChallengeFromRoute) {
      return;
    }

    let isActive = true;

    async function requestInitialCode() {
      try {
        setIsResending(true);
        setStatusMessage(copy.sendingInitialCode);

        const challenge = await emailVerificationService.requestCode({ fullName: getRequestDisplayName() });

        if (!isActive) {
          return;
        }

        setExpirationMessage(getExpirationText(challenge.expiresAt, copy));
        setStatusMessage(
          challenge.devCode
            ? copy.developmentCode(challenge.devCode)
            : `${copy.codeSent(displayEmail)}${copy.checkSpamSuffix}`
        );
      } catch (error) {
        if (isActive) {
          setStatusMessage(getAuthErrorMessage(error, language));
        }
      } finally {
        if (isActive) {
          setIsResending(false);
        }
      }
    }

    requestInitialCode();

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayEmail, getRequestDisplayName, hasChallengeFromRoute, language]);

  async function handleCheckVerification() {
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      setStatusMessage(copy.enterCodePrompt);
      return;
    }

    try {
      setIsChecking(true);
      setStatusMessage(copy.verifying);

      await emailVerificationService.verifyCode(cleanCode);
      const user = await authService.refreshCurrentUser();

      await firestoreTeamSyncService.ensureUserProfile({
        user,
        status: "emailVerified",
      });

      setStatusMessage(copy.verifiedMovingOn);

      router.replace({
        pathname: nextRoute,
        params: {
          fullName: user.displayName ?? displayName,
          email: user.email ?? displayEmail,
        },
      } as never);
    } catch (error) {
      setStatusMessage(getAuthErrorMessage(error, language));
    } finally {
      setIsChecking(false);
    }
  }

  async function handleResendCode() {
    try {
      setIsResending(true);
      setStatusMessage(copy.sendingNewCode);

      const challenge = await emailVerificationService.requestCode({ fullName: getRequestDisplayName() });

      setExpirationMessage(getExpirationText(challenge.expiresAt, copy));
      setStatusMessage(
        challenge.devCode
          ? copy.newDevelopmentCode(challenge.devCode)
          : copy.newCodeSent
      );
    } catch (error) {
      setStatusMessage(getAuthErrorMessage(error, language));
    } finally {
      setIsResending(false);
    }
  }

  async function handleBackToLogin() {
    try {
      if (authService.isConfigured()) {
        await authService.logout();
      }
    } finally {
      router.replace("/login" as never);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/login" />

        <Text style={styles.logo}>{copy.logo}</Text>
        <StatusBadge label={copy.badge} tone="info" style={styles.badge} />
        <Text style={styles.title}>{copy.title}</Text>

        <Text style={styles.subtitle}>
          {copy.subtitle}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{copy.infoTitle}</Text>
          <Text style={styles.infoText}>{copy.infoStep1}</Text>
          <Text style={styles.infoText}>{copy.infoStep2}</Text>
          <Text style={styles.infoText}>{copy.infoStep3}</Text>
          <Text style={styles.infoText}>{expirationMessage}</Text>
        </View>

        <TextField
          label={copy.codeFieldLabel}
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder={copy.codePlaceholder}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          accessibilityLabel={copy.codeFieldAccessibilityLabel}
          containerStyle={styles.inputGroup}
        />

        <Text style={styles.statusText}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isChecking ? copy.checkingButton : copy.checkButton}
            onPress={handleCheckVerification}
            disabled={isChecking || isResending}
            accessibilityLabel={copy.checkButtonAccessibilityLabel}
            style={styles.button}
          />

          <AppButton
            title={isResending ? copy.resendingButton : copy.resendButton}
            variant="secondary"
            onPress={handleResendCode}
            disabled={isChecking || isResending}
            accessibilityLabel={copy.resendButtonAccessibilityLabel}
            style={styles.button}
          />

          <AppButton
            title={copy.backButton}
            variant="ghost"
            onPress={handleBackToLogin}
            accessibilityLabel={copy.backButtonAccessibilityLabel}
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
  infoBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    gap: theme.spacing.sm,
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
  inputGroup: {
    width: "100%",
    marginTop: theme.spacing["2xl"],
  },
  statusText: {
    ...Typography.supporting,
    marginTop: theme.spacing.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});
