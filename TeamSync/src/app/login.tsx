import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { getFirebaseConfigStatusMessage } from "@/lib/firebase";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";

function isValidEmail(value: string) {
  const trimmedValue = value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(trimmedValue);
}

export default function LoginScreen() {
  const router = useRouter();
  const firebaseIsReady = authService.isConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(getFirebaseConfigStatusMessage());
  const [error, setError] = useState("");

  function clearErrorOnChange() {
    if (error !== "") {
      setError("");
    }
  }

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(getFirebaseConfigStatusMessage());
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    if (password.trim() === "") {
      setError("Lütfen şifrenizi giriniz.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setStatusMessage("Giriş yapılıyor...");

      await authService.loginWithEmail({ email: trimmedEmail, password });
      const refreshedUser = await authService.refreshCurrentUser();

      if (!refreshedUser.emailVerified) {
        await authService.sendVerificationEmail(refreshedUser);
        await authService.logout();
        setError("E-posta adresin doğrulanmamış. Doğrulama linkini tekrar gönderdik; mailini doğrulayıp yeniden giriş yap.");
        setStatusMessage("E-posta doğrulaması gerekli.");
        return;
      }

      await firestoreTeamSyncService.ensureUserProfile({
        user: refreshedUser,
        role: "clubAdmin",
        status: "emailVerified",
      });

      setStatusMessage("Giriş başarılı. Workspace kontrol ediliyor.");
      router.replace("/dashboard");
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
      setStatusMessage("Giriş tamamlanamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!firebaseIsReady) {
      setError(getFirebaseConfigStatusMessage());
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Şifre yenileme linki için geçerli e-posta adresini giriniz.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await authService.sendPasswordReset(trimmedEmail);
      setStatusMessage("Şifre yenileme linki e-posta adresine gönderildi.");
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

        <Text style={styles.logo}>MaviTeam</Text>
        <Text style={styles.badge}>Güvenli hesap girişi</Text>

        <Text style={styles.title}>Giriş yap</Text>

        <Text style={styles.subtitle}>
          Kulübünüzü, takımlarınızı ve antrenman planlarınızı doğrulanmış MaviTeam hesabınızla yönetmeye devam edin.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Firebase Auth durumu</Text>
          <Text style={styles.infoText}>{statusMessage}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
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
              accessibilityLabel="E-posta adresi"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi giriniz"
              placeholderTextColor={theme.colors.text.muted}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearErrorOnChange();
              }}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              accessibilityLabel="Şifre"
            />
          </View>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
            onPress={handleLogin}
            disabled={isSubmitting || !firebaseIsReady}
            accessibilityLabel="MaviTeam hesabına giriş yap"
            style={styles.button}
          />

          <AppButton
            title="Şifremi unuttum"
            variant="secondary"
            onPress={handlePasswordReset}
            disabled={isSubmitting || !firebaseIsReady}
            accessibilityLabel="Şifre yenileme e-postası gönder"
            style={styles.button}
          />

          <Link href="/" asChild>
            <AppButton
              title="Ana sayfaya dön"
              variant="ghost"
              accessibilityLabel="Ana sayfaya dön"
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
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
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
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["4xl"],
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    lineHeight: theme.lineHeights.xl,
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  infoBox: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  form: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    fontSize: theme.fontSizes.lg,
  },
  errorText: {
    color: theme.colors.text.danger,
    textAlign: "center",
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.lg,
  },
  buttonGroup: {
    gap: theme.spacing.md,
  },
  button: {
    width: "100%",
  },
});
