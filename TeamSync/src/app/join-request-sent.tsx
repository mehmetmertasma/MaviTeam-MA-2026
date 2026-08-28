import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Typography, theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    back: en ? "Go back" : "Geri dön",
    logo: "MaviTeam",
    requestSent: en ? "Request sent" : "İstek gönderildi",
    title: en ? "Waiting for admin approval" : "Admin onayı bekleniyor",
    subtitle: en
      ? "Your join request has been submitted and is pending. You'll get dashboard access once the club admin approves it."
      : "Katılma isteğin gönderildi ve onay bekliyor. Kulüp yöneticisi onayladıktan sonra dashboard erişimin açılacak.",
    requestSummary: en ? "Request summary" : "Başvuru özeti",
    loadingUser: en ? "Loading account info" : "Kullanıcı bilgisi yükleniyor",
    loadingEmail: en ? "Loading email" : "E-posta yükleniyor",
    loadingClub: en ? "Loading club info" : "Kulüp bilgisi yükleniyor",
    howItWorksTitle: en ? "How it works" : "Süreç nasıl çalışır?",
    step1: en ? "1. You enter the team/club code." : "1. Takım/kulüp kodunu girersin.",
    step2: en ? "2. Your join request is submitted." : "2. Katılma isteğin gönderilir.",
    step3: en ? "3. Once an admin approves you, you can use the app." : "3. Admin seni onayladıktan sonra uygulamayı kullanırsın.",
    currentStatus: en ? "Current status" : "Şu anki durum",
    awaitingApproval: en ? "Awaiting approval" : "Onay bekliyor",
    lookingForRequest: en ? "Looking for your request" : "Başvurun aranıyor",
    checking: en ? "Checking..." : "Kontrol ediliyor...",
    refreshStatus: en ? "Refresh status" : "Durumu yenile",
    refreshStatusA11y: en ? "Refresh approval status" : "Onay durumunu yenile",
    reenterCode: en ? "Re-enter code" : "Kodu yeniden gir",
    reenterCodeA11y: en ? "Re-enter the team code" : "Takım kodunu yeniden gir",
    signOutAndReturn: en ? "Sign out and return home" : "Çıkış yap ve ana sayfaya dön",
  };
}

export default function JoinRequestSentScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const { appData, refresh } = useAppDataContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (appData !== null && appData.currentUser.status === "active" && appData.currentUser.clubId !== "") {
      router.replace("/dashboard" as never);
    }
  }, [appData]);

  const currentUser = appData?.currentUser;
  const currentClub = appData?.club;
  const currentRequest = appData?.joinRequests.find(
    (request) => request.userId === currentUser?.id && request.status === "pending"
  );

  function handleRetryCode() {
    router.replace("/join-club" as never);
  }

  async function handleRefreshStatus() {
    try {
      setIsRefreshing(true);
      await refresh();
    } catch {
      // Keep showing the last known status; the button stays available to retry.
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleBackHome() {
    try {
      if (authService.isConfigured()) {
        await authService.logout();
      }
    } finally {
      router.replace("/" as never);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton label={copy.back} fallbackHref="/join-club" onPress={handleRetryCode} />

        <Text style={styles.logo}>{copy.logo}</Text>

        <StatusBadge label={copy.requestSent} tone="warning" style={styles.badge} />

        <Text style={styles.title}>{copy.title}</Text>

        <Text style={styles.subtitle}>
          {copy.subtitle}
        </Text>

        <View style={styles.requestBox}>
          <Text style={styles.requestLabel}>{copy.requestSummary}</Text>
          <Text style={styles.requestValue}>{currentUser?.fullName ?? copy.loadingUser}</Text>
          <Text style={styles.requestText}>{currentUser?.email ?? copy.loadingEmail}</Text>
          <Text style={styles.requestText}>{currentClub?.name ?? copy.loadingClub}</Text>
        </View>

        <View style={styles.stepsBox}>
          <Text style={styles.stepsTitle}>{copy.howItWorksTitle}</Text>

          <Text style={styles.stepText}>{copy.step1}</Text>
          <Text style={styles.stepText}>{copy.step2}</Text>
          <Text style={styles.stepText}>{copy.step3}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>{copy.currentStatus}</Text>
          <StatusBadge
            label={currentRequest?.status === "pending" ? copy.awaitingApproval : copy.lookingForRequest}
            tone={currentRequest?.status === "pending" ? "warning" : "neutral"}
          />
        </View>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isRefreshing ? copy.checking : copy.refreshStatus}
            onPress={handleRefreshStatus}
            disabled={isRefreshing}
            accessibilityLabel={copy.refreshStatusA11y}
            style={styles.button}
          />

          <AppButton
            title={copy.reenterCode}
            variant="secondary"
            onPress={handleRetryCode}
            accessibilityLabel={copy.reenterCodeA11y}
            style={styles.button}
          />

          <AppButton
            title={copy.signOutAndReturn}
            variant="ghost"
            onPress={handleBackHome}
            accessibilityLabel={copy.signOutAndReturn}
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
  requestBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  requestLabel: {
    ...Typography.caption,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  requestValue: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  requestText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  stepsBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  stepsTitle: {
    ...Typography.cardTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  stepText: {
    ...Typography.supporting,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.lg,
    marginBottom: theme.spacing.sm,
  },
  statusBox: {
    width: "100%",
    backgroundColor: theme.colors.state.warningSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  statusLabel: {
    ...Typography.label,
    color: theme.colors.text.warning,
  },
  buttonGroup: { width: "100%", gap: theme.spacing.md },
  button: { width: "100%" },
});
