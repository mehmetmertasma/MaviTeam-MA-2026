import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";

const t = translations[defaultLanguage];

export default function JoinClubScreen() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  function handleJoinClub() {
    if (inviteCode.trim() === "") {
      setError(t.joinClub.validation.invitationCodeRequired);
      return;
    }

    setError("");
    router.push("/dashboard");
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.title}>{t.joinClub.title}</Text>

        <Text style={styles.subtitle}>{t.joinClub.subtitle}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.joinClub.invitationCodeLabel}</Text>

            <TextInput
              style={styles.input}
              placeholder={t.joinClub.invitationCodePlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              accessibilityLabel="Davet kodu"
            />
          </View>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={t.joinClub.submitButton}
            onPress={handleJoinClub}
            accessibilityLabel="Davet kodu ile kulübe katıl ve kontrol paneline git"
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
  form: {
    width: "100%",
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