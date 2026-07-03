import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { emailVerificationCodeService } from "@/services/emailVerificationCodeService";
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

function cleanCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, fullName, next } = useLocalSearchParams();
  const nextRoute = getNextRoute(next);
  const displayEmail = getFirstParam(email);
  const displayName = getFirstParam(fullName);

  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    displayEmail
      ? `${displayEmail} adresine 6 haneli MaviTeam doğrulama kodu gönderdik.`
      : "E-posta adresine 6 haneli MaviTeam doğrulama kodu gönderdik."
  );

  async function handleVerifyCode() {
    const verificationCode = cleanCode(code);

    if (verificationCode.length !== 6) {
      setStatusMessage("Lütfen e-postana gelen 6 haneli doğrulama kodunu gir.");
      return;
    }

    try {
      setIsChecking(true);
      setStatusMessage("Kod kontrol ediliyor...");

      await emailVerificationCodeService.verifyCode(verificationCode);
      const user = await authService.refreshCurrentUser();

      await firestoreTeamSyncService.ensureUserProfile({
        user,
        role: nextRoute === "/create-club" ? "clubAdmin" : "athlete",
        status: "emailVerified",
      });

      setStatusMessage("E-posta doğrulandı. Sonraki adıma geçiliyor...");

      router.replace({
        pathname: nextRoute,
        params: {
          fullName: user.displayName ?? displayName,
          email: user.email ?? displayEmail,
        },
      } as never);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : getAuthErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }

  async function handleResendVerification() {
    try {
      setIsResending(true);
      setStatusMessage("Yeni doğrulama kodu gönderiliyor...");
      await emailVerificationCodeService.sendCode();
      setCode("");
      setStatusMessage("Yeni 6 haneli doğrulama kodu gönderildi. Mail kutunu ve spam klasörünü kontrol et.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : getAuthErrorMessage(error));
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

        <Text style={styles.logo}>MaviTeam</Text>
        <Text style={styles.badge}>Kod doğrulama</Text>
        <Text style={styles.title}>E-postandaki kodu gir</Text>

        <Text style={styles.subtitle}>
          Hesabını güvenli hale getirmek için e-postana gönderdiğimiz 6 haneli kodu gir.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Nasıl çalışır?</Text>
          <Text style={styles.infoText}>1. Mail kutunu ve spam klasörünü kontrol et.</Text>
          <Text style={styles.infoText}>2. MaviTeam doğrulama kodunu kopyala.</Text>
          <Text style={styles.infoText}>3. Kodu aşağıya yazıp devam et.</Text>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.label}>6 haneli kod</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(cleanCode(value))}
            placeholder="123456"
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.codeInput}
            accessibilityLabel="6 haneli doğrulama kodu"
          />
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isChecking ? "Kontrol ediliyor..." : "Kodu doğrula ve devam et"}
            onPress={handleVerifyCode}
            disabled={isChecking || isResending}
            accessibilityLabel="Doğrulama kodunu kontrol et"
            style={styles.button}
          />

          <AppButton
            title={isResending ? "Yeni kod gönderiliyor..." : "Yeni kod gönder"}
            variant="secondary"
            onPress={handleResendVerification}
            disabled={isChecking || isResending}
            accessibilityLabel="Yeni doğrulama kodu gönder"
            style={styles.button}
          />

          <AppButton
            title="Giriş ekranına dön"
            variant="ghost"
            onPress={handleBackToLogin}
            accessibilityLabel="Giriş ekranına dön"
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
  codeBox: {
    width: "100%",
    marginTop: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  codeInput: {
    width: "100%",
    minHeight: 58,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "center",
    letterSpacing: 8,
  },
  statusText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.secondary,
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
  button: { width: "100%" },
});
