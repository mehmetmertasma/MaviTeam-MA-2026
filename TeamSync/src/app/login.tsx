import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { teamSyncService } from "@/services/teamSyncService";

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
  const [statusMessage, setStatusMessage] = useState(
    firebaseIsReady
      ? "Firebase Auth hazır. E-posta ve şifre ile giriş yapabilirsin."
      : "Firebase ayarları eksik. Gerçek giriş için önce .env bilgileri eklenmeli."
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
      setError("Firebase ayarları eksik. .env dosyasını ekleyip uygulamayı yeniden başlat.");
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

      const user = await authService.loginWithEmail({ email: trimmedEmail, password });
      const displayName = user.displayName?.trim();

      await teamSyncService.updateCurrentUser({
        email: user.email ?? trimmedEmail,
        status: "active",
        ...(displayName ? { fullName: displayName } : {}),
      });

      setStatusMessage("Giriş başarılı. Dashboard açılıyor.");
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
      setError("Firebase ayarları eksik. Şifre yenileme için önce Firebase bağlantısı kurulmalı.");
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

        <Text style={styles.logo}>TeamSync</Text>
        <Text style={styles.badge}>Güvenli hesap girişi</Text>

        <Text style={styles.title}>Giriş yap</Text>

        <Text style={styles.subtitle}>
          Kulübünüzü, takımlarınızı ve antrenman planlarınızı gerçek TeamSync hesabınızla yönetmeye devam edin.
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
            accessibilityLabel="TeamSync hesabına giriş yap"
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
