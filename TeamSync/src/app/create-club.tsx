import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { Typography, theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function generatePreviewCode(clubName: string, fallbackPrefix: string) {
  const prefix = clubName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "")
    .slice(0, 3);

  return `${prefix || fallbackPrefix}${new Date().getFullYear()}`;
}

export default function CreateClubScreen() {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();
  const { t } = useTranslation();

  const ownerFullName = getParamValue(fullName);
  const ownerEmail = getParamValue(email);

  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewCode = generatePreviewCode(clubName, t.createClub.defaultCodePrefix);

  async function handleCreateClub() {
    const trimmedClubName = clubName.trim();
    const trimmedSport = sport.trim();
    const trimmedCity = city.trim();

    if (trimmedClubName === "") {
      setError(t.createClub.validation.clubNameRequired);
      return;
    }

    if (trimmedSport === "") {
      setError(t.createClub.validation.sportRequired);
      return;
    }

    if (trimmedCity === "") {
      setError(t.createClub.validation.cityRequired);
      return;
    }

    const firebaseUser = authService.getCurrentUser();

    if (authService.isConfigured() && firebaseUser === null) {
      setError(t.createClub.validation.loginRequired);
      return;
    }

    if (authService.isConfigured() && firebaseUser !== null && !firebaseUser.emailVerified) {
      setError(t.createClub.validation.emailVerificationRequired);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const nextData = await teamSyncService.createClubWorkspace({
        ownerFullName: ownerFullName || firebaseUser?.displayName || t.createClub.ownerFallbackName,
        ownerEmail: ownerEmail || firebaseUser?.email || t.createClub.ownerFallbackEmail,
        clubName: trimmedClubName,
        sport: trimmedSport,
        city: trimmedCity,
      });

      if (authService.isConfigured() && firebaseUser !== null) {
        await firestoreTeamSyncService.createClubWorkspace({
          firebaseUser,
          clubId: nextData.club.id,
          clubName: nextData.club.name,
          sport: nextData.club.sport,
          city: nextData.club.city,
          clubCode: nextData.club.code,
        });
      }

      router.replace("/dashboard");
    } catch (createClubError) {
      setError(getAuthErrorMessage(createClubError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />

        <Text style={styles.logo}>{t.common.appName}</Text>

        <StatusBadge label={t.createClub.badge} tone="info" style={styles.badge} />

        <Text style={styles.title}>{t.createClub.title}</Text>

        <Text style={styles.subtitle}>{t.createClub.subtitle}</Text>

        <View style={styles.ownerBox}>
          <Text style={styles.ownerLabel}>{t.createClub.ownerInfoTitle}</Text>
          <Text style={styles.ownerText}>{ownerFullName || t.createClub.ownerNameFallback}</Text>
          <Text style={styles.ownerText}>{ownerEmail || t.createClub.ownerEmailFallback}</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label={t.createClub.clubNameLabel}
            placeholder={t.createClub.clubNamePlaceholder}
            value={clubName}
            onChangeText={setClubName}
            accessibilityLabel={t.createClub.accessibility.clubName}
          />

          <TextField
            label={t.createClub.sportLabel}
            placeholder={t.createClub.sportPlaceholder}
            value={sport}
            onChangeText={setSport}
            accessibilityLabel={t.createClub.accessibility.sport}
          />

          <TextField
            label={t.createClub.cityLabel}
            placeholder={t.createClub.cityPlaceholder}
            value={city}
            onChangeText={setCity}
            accessibilityLabel={t.createClub.accessibility.city}
          />
        </View>

        <View style={styles.codePreviewBox}>
          <Text style={styles.codePreviewLabel}>{t.createClub.invitationCodePreview}</Text>
          <Text style={styles.codePreviewValue}>{previewCode}</Text>
          <Text style={styles.codePreviewHint}>{t.createClub.invitationCodeHint}</Text>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? t.createClub.submittingButton : t.createClub.submitButton}
            onPress={handleCreateClub}
            disabled={isSubmitting}
            accessibilityLabel={t.createClub.accessibility.submit}
            style={styles.button}
          />

          <Link href="/" asChild>
            <AppButton
              title={t.createClub.backHome}
              variant="ghost"
              accessibilityLabel={t.createClub.accessibility.backHome}
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
  ownerBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  ownerLabel: {
    ...Typography.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ownerText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
  },
  form: { width: "100%", gap: theme.spacing.lg },
  codePreviewBox: {
    width: "100%",
    backgroundColor: theme.colors.state.infoSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  codePreviewLabel: {
    ...Typography.caption,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  codePreviewValue: {
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  codePreviewHint: {
    ...Typography.caption,
    color: theme.colors.text.secondary,
  },
  errorText: {
    ...Typography.supporting,
    marginTop: theme.spacing.lg,
    color: theme.colors.text.danger,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});
