import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  const { email, fullName, next, verificationCode } = useLocalSearchParams();
  const nextRoute = getNextRoute(next);
  const displayEmail = getFirstParam(email);
  const displayName = getFirstParam(fullName);
  const expectedCode = getFirstParam(verificationCode);

  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    expectedCode
      ? `Test doğrulama kodu: ${expectedCode}`
      : "E-posta doğrulama kodunu gir."
  );

  async function handleCheckVerification() {
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      setStatusMessage("Lütfen 6 haneli doğrulama kodunu gir.");
      return;
    }

    if (expectedCode && cleanCode !== expectedCode) {
      setStatusMessage("Kod yanlış. Lütfen kodu kontrol edip tekrar dene.");
      return;
    }

    try {
      setIsChecking(true);
      setStatusMessage("Kod doğrulanıyor...");

      const user = authService.getCurrentUser();

      if (user === null) {
        setStatusMessage("Oturum bulunamadı. Lütfen tekrar giriş yap.");
        return;
      }

      await firestoreTeamSyncService.ensureUserProfile({
        user,
        role: nextRoute === "/create-club" ? "clubAdmin" : "athlete",
        status: "emailVerified",
      });

      setStatusMessage("Kod doğrulandı. Sonraki adıma geçiliyor...");

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
        <Text style={styles.title}>Doğrulama kodunu gir</Text>

        <Text style={styles.subtitle}>
          MaviTeam hesabını güvenli hale getirmek için 6 haneli doğrulama kodunu girmen gerekiyor.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Ne yapmalısın?</Text>
          <Text style={styles.infoText}>1. 6 haneli doğrulama kodunu kontrol et.</Text>
          <Text style={styles.infoText}>2. Kodu aşağıdaki alana yaz.</Text>
          <Text style={styles.infoText}>3. “Kodu doğrula” butonuna bas.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Doğrulama kodu</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            style={styles.input}
            accessibilityLabel="Doğrulama kodu"
          />
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isChecking ? "Kontrol ediliyor..." : "Kodu doğrula"}
            onPress={handleCheckVerification}
            disabled={isChecking}
            accessibilityLabel="Doğrulama kodunu kontrol et"
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
  inputGroup: {
    width: "100%",
    marginTop: theme.spacing["2xl"],
  },
  inputLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    marginBottom: theme.spacing.sm,
  },
  input: {
    width: "100%",
    minHeight: 56,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    letterSpacing: 6,
    textAlign: "center",
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
