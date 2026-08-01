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

export default function JoinClubScreen() {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();
  const { t } = useTranslation();

  const requestFullName = getParamValue(fullName);
  const requestEmail = getParamValue(email);

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInviteCodeChange(text: string) {
    const formattedCode = text.toUpperCase().replace(/\s/g, "");

    setInviteCode(formattedCode);

    if (error !== "") {
      setError("");
    }
  }

  async function handleJoinClub() {
    const cleanedCode = inviteCode.trim();

    if (cleanedCode === "") {
      setError(t.joinClub.validation.invitationCodeRequired);
      return;
    }

    if (cleanedCode.length < 4) {
      setError(t.joinClub.validation.invitationCodeInvalid);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setError(t.joinClub.validation.loginRequired);
          return;
        }

        if (!firebaseUser.emailVerified) {
          setError(t.joinClub.validation.emailVerificationRequired);
          return;
        }

        await firestoreTeamSyncService.requestJoinClub({
          firebaseUser,
          inviteCode: cleanedCode,
          requestedRole: "athlete",
        });
      } else {
        await teamSyncService.createJoinRequest({
          fullName: requestFullName || t.joinClub.fallbackName,
          email: requestEmail || t.joinClub.fallbackEmail,
          inviteCode: cleanedCode,
          requestedRole: "athlete",
        });
      }

      router.replace("/join-request-sent");
    } catch (joinError) {
      const message = joinError instanceof Error && joinError.message === "INVALID_CLUB_CODE"
        ? t.joinClub.messages.invalidCode
        : getAuthErrorMessage(joinError);

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />
        <Text style={styles.logo}>{t.common.appName}</Text>

        <StatusBadge label={t.joinClub.badge} tone="info" style={styles.badge} />

        <Text style={styles.title}>{t.joinClub.title}</Text>

        <Text style={styles.subtitle}>{t.joinClub.subtitle}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.joinClub.accountInfoTitle}</Text>
          <Text style={styles.infoText}>{requestFullName || t.joinClub.accountNameFallback}</Text>
          <Text style={styles.infoText}>{requestEmail || t.joinClub.accountEmailFallback}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t.joinClub.codeInfoTitle}</Text>
          <Text style={styles.infoText}>{t.joinClub.codeInfoText}</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label={t.joinClub.invitationCodeLabel}
            placeholder={t.joinClub.invitationCodePlaceholder}
            value={inviteCode}
            onChangeText={handleInviteCodeChange}
            autoCapitalize="characters"
            accessibilityLabel={t.joinClub.accessibility.invitationCode}
          />
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? t.joinClub.submittingButton : t.joinClub.submitButton}
            onPress={handleJoinClub}
            disabled={isSubmitting}
            accessibilityLabel={t.joinClub.accessibility.submit}
            style={styles.button}
          />

          <Link href="/" asChild>
            <AppButton
              title={t.joinClub.backHome}
              variant="ghost"
              accessibilityLabel={t.joinClub.accessibility.backHome}
              style={styles.button}
            />
          </Link>
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
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
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
  form: { width: "100%", gap: theme.spacing.lg },
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
