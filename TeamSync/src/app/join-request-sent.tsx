import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Typography, theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";

export default function JoinRequestSentScreen() {
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
        <AppBackButton label="Geri dön" fallbackHref="/join-club" onPress={handleRetryCode} />

        <Text style={styles.logo}>TeamSync</Text>

        <StatusBadge label="İstek gönderildi" tone="warning" style={styles.badge} />

        <Text style={styles.title}>Admin onayı bekleniyor</Text>

        <Text style={styles.subtitle}>
          Katılma isteğin merkezi TeamSync datasına pending olarak kaydedildi. Kulüp yöneticisi onayladıktan sonra dashboard erişimi açılacak.
        </Text>

        <View style={styles.requestBox}>
          <Text style={styles.requestLabel}>Başvuru özeti</Text>
          <Text style={styles.requestValue}>{currentUser?.fullName ?? "Kullanıcı bilgisi yükleniyor"}</Text>
          <Text style={styles.requestText}>{currentUser?.email ?? "E-posta yükleniyor"}</Text>
          <Text style={styles.requestText}>{currentClub?.name ?? "Kulüp bilgisi yükleniyor"}</Text>
        </View>

        <View style={styles.stepsBox}>
          <Text style={styles.stepsTitle}>Süreç nasıl çalışır?</Text>

          <Text style={styles.stepText}>1. Takım/kulüp kodunu girersin.</Text>
          <Text style={styles.stepText}>2. Katılma isteğin merkezi joinRequests datasına yazılır.</Text>
          <Text style={styles.stepText}>3. Admin seni onayladıktan sonra uygulamayı kullanırsın.</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Şu anki durum</Text>
          <StatusBadge
            label={currentRequest?.status === "pending" ? "Onay bekliyor" : "Pending kayıt aranıyor"}
            tone={currentRequest?.status === "pending" ? "warning" : "neutral"}
          />
        </View>

        <View style={styles.buttonGroup}>
          <AppButton
            title={isRefreshing ? "Kontrol ediliyor..." : "Durumu yenile"}
            onPress={handleRefreshStatus}
            disabled={isRefreshing}
            accessibilityLabel="Onay durumunu yenile"
            style={styles.button}
          />

          <AppButton
            title="Kodu yeniden gir"
            variant="secondary"
            onPress={handleRetryCode}
            accessibilityLabel="Takım kodunu yeniden gir"
            style={styles.button}
          />

          <AppButton
            title="Çıkış yap ve ana sayfaya dön"
            variant="ghost"
            onPress={handleBackHome}
            accessibilityLabel="Çıkış yap ve ana sayfaya dön"
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
