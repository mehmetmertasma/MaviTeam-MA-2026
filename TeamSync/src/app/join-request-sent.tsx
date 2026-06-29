import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

export default function JoinRequestSentScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRequestData() {
        try {
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
          }
        } catch {
          if (isActive) {
            setAppData(null);
          }
        }
      }

      loadRequestData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const currentUser = appData?.currentUser;
  const currentClub = appData?.club;
  const currentRequest = appData?.joinRequests.find(
    (request) => request.userId === currentUser?.id && request.status === "pending"
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>TeamSync</Text>

          <Text style={styles.badge}>İstek gönderildi</Text>

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
            <Text style={styles.statusValue}>{currentRequest?.status === "pending" ? "Onay bekliyor" : "Pending kayıt aranıyor"}</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Link href="/join-club" asChild>
              <AppButton
                title="Kodu yeniden gir"
                variant="secondary"
                accessibilityLabel="Takım kodunu yeniden gir"
                style={styles.button}
              />
            </Link>

            <Link href="/" asChild>
              <AppButton
                title="Ana sayfaya dön"
                variant="ghost"
                accessibilityLabel="Ana sayfaya dön"
                style={styles.button}
              />
            </Link>
          </View>
        </View>
      </View>
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
  container: { width: "100%", maxWidth: 560 },
  card: {
    width: "100%",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.md,
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
    backgroundColor: theme.colors.state.warningSoft,
    color: theme.colors.text.warning,
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
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  requestValue: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  requestText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
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
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  stepText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
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
  },
  statusLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.warning,
    marginBottom: theme.spacing.xs,
  },
  statusValue: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.warning,
  },
  buttonGroup: { width: "100%", gap: theme.spacing.md },
  button: { width: "100%" },
});
