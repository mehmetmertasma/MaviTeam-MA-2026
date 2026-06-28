import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";

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

  const [fullName, setFullName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [statusMessage, setStatusMessage] = useState("Bilgilerini girip devam edebilirsin.");

  function handleContinue() {
    const trimmedName = fullName.trim();
    const trimmedEmail = contactInfo.trim().toLowerCase();

    if (trimmedName === "") {
      setStatusMessage("Lütfen ad soyad bilgisini giriniz.");
      return;
    }

    if (trimmedEmail === "") {
      setStatusMessage("Lütfen e-posta adresini giriniz.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatusMessage("Lütfen geçerli bir e-posta adresi giriniz. Örn. isim@email.com");
      return;
    }

    setStatusMessage("Bilgiler alındı. Sonraki adıma geçiliyor.");
    router.replace(getNextRoute(next) as never);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>TeamSync</Text>
        <Text style={styles.badge}>Kullanıcı bilgileri</Text>
        <Text style={styles.title}>Hesap oluştur</Text>
        <Text style={styles.subtitle}>
          Önce kendi bilgilerini gir. Sonra kulüp oluşturabilir veya takım kodu ile katılabilirsin.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Örn. Mert Asma"
              placeholderTextColor={theme.colors.text.muted}
              style={styles.input}
              accessibilityLabel="Ad soyad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="ornek@email.com"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="E-posta adresi"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Sonraki adım</Text>
          <Text style={styles.infoText}>
            Gerçek giriş sistemi bağlanınca bu ekrana parola alanı ve Firebase kayıt işlemi eklenecek.
          </Text>
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>

        <View style={styles.buttonGroup}>
          <AppButton
            title="Devam et"
            onPress={handleContinue}
            accessibilityLabel="Bilgilerle devam et"
            style={styles.button}
          />

          <AppButton
            title="Ana sayfaya dön"
            variant="ghost"
            onPress={() => router.replace("/")}
            accessibilityLabel="Ana sayfaya dön"
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
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});