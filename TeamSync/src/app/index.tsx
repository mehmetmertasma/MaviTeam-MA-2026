import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";

const t = translations[defaultLanguage];

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScreenCard centered style={styles.card}>
        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.badge}>Türkiye Kulüp Yönetim Platformu</Text>

        <Text style={styles.title}>{t.home.title}</Text>

        <Text style={styles.subtitle}>{t.home.subtitle}</Text>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>{t.home.featuresTitle}</Text>

          {t.home.features.map((feature) => (
            <Text key={feature} style={styles.featureText}>
              ✓ {feature}
            </Text>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <Link href="/create-club" asChild>
            <AppButton
              title={t.home.primaryAction}
              accessibilityLabel="Yeni kulüp oluşturma sayfasına git"
              style={styles.button}
            />
          </Link>

          <Link href="/join-club" asChild>
            <AppButton
              title={t.home.secondaryAction}
              variant="secondary"
              accessibilityLabel="Davet kodu ile kulübe katılma sayfasına git"
              style={styles.button}
            />
          </Link>
        </View>

        <Text style={styles.footerText}>
          Voleybol, basketbol, futbol ve diğer spor kulüpleri için geliştirildi.
        </Text>
      </ScreenCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  card: {
    padding: theme.spacing["3xl"],
  },
  logo: {
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  badge: {
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
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.lineHeights.xl,
    marginBottom: theme.spacing["2xl"],
  },
  featureBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
  },
  featureTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.lg,
    marginBottom: theme.spacing.sm,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
  },
  button: {
    width: "100%",
  },
  footerText: {
    marginTop: theme.spacing["2xl"],
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: "center",
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
});