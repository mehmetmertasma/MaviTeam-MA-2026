import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { authService, getAuthErrorMessage } from "@/services/authService";
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

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, fullName, next } = useLocalSearchParams();
  const nextRoute = getNextRoute(next);
  const displayEmail = getFirstParam(email);
  const displayName = getFirstParam(fullName);

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    displayEmail
      ? `${displayEmail} adresine doğrulama linki gönderdik.`
      : "E-posta adresine doğrulama linki gönderdik."
  );

  async function handleCheckVerification() {
    try {
      setIsChecking(true);
      setStatusMessage("E-posta doğrulama durumu kontrol ediliyor...");

      const user = await authService.refreshCurrentUser();

      if (!user.emailVerified) {
        setStatusMessage("E-posta henüz doğrulanmamış. Mail kutundaki linke tıkla, sonra tekrar kontrol et.");
        return;
      }

      setStatusMessage("E-posta doğrulandı. Firestore kullanıcı profili hazırlanıyor...");

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
      setStatusMessage(getAuthErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }

  async function handleResendVerification() {
    try {
      setIsResending(true);
      setStatusMessage("Doğrulama e-postası tekrar gönderiliyor...");
      await authService.sendVerificationEmail();
      setStatusMessage("Doğrulama e-postası tekrar gönderildi. Spam/Junk klasörünü de kontrol et.");
    } catch (error) {
      setStatusMessage(getAuthErrorMessage(error));
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

        <Text style={styles.logo}>TeamSync</Text>
        <Text style={styles.badge}>E-posta doğrulama</Text>
        <Text style={styles.title}>Mailini kontrol et</Text>

        <Text style={styles.subtitle}>
          TeamSync hesabını güvenli hale getirmek için e-posta adresini doğrulaman gerekiyor.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Ne yapmalısın?</Text>
          <Text style={styles.infoText}>1. Mail kutunu aç.</Text>
          <Text style={styles.infoText}>2. Firebase/TeamSync doğrulama linkine tıkla.</Text>
          <Text style={styles.infoText}>3. Bu sayfaya dönüp “Doğruladım, devam et” butonuna bas.</Text>
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isChecking ? "Kontrol ediliyor..." : "Doğruladım, devam et"}
            onPress={handleCheckVerification}
            disabled={isChecking || isResending}
            accessibilityLabel="E-posta doğrulama durumunu kontrol et"
            style={styles.button}
          />

          <AppButton
            title={isResending ? "Tekrar gönderiliyor..." : "Doğrulama emailini tekrar gönder"}
            variant="secondary"
            onPress={handleResendVerification}
            disabled={isChecking || isResending}
            accessibilityLabel="Doğrulama e-postasını tekrar gönder"
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
