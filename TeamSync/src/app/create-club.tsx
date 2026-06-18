import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";

const t = translations[defaultLanguage];

export default function CreateClubScreen() {
  const router = useRouter();

  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");

  function handleCreateClub() {
    if (clubName.trim() === "") {
      setError(t.createClub.validation.clubNameRequired);
      return;
    }

    if (sport.trim() === "") {
      setError(t.createClub.validation.sportRequired);
      return;
    }

    if (city.trim() === "") {
      setError(t.createClub.validation.cityRequired);
      return;
    }

    setError("");
    router.push("/dashboard");
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.title}>{t.createClub.title}</Text>

        <Text style={styles.subtitle}>{t.createClub.subtitle}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.createClub.clubNameLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.createClub.clubNamePlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              value={clubName}
              onChangeText={setClubName}
              accessibilityLabel="Kulüp adı"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.createClub.sportLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.createClub.sportPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              value={sport}
              onChangeText={setSport}
              accessibilityLabel="Branş"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.createClub.cityLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.createClub.cityPlaceholder}
              placeholderTextColor={theme.colors.text.muted}
              value={city}
              onChangeText={setCity}
              accessibilityLabel="Şehir"
            />
          </View>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={t.createClub.submitButton}
            onPress={handleCreateClub}
            accessibilityLabel="Kulübü oluştur ve kontrol paneline git"
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