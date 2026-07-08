import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard centered style={styles.card}>
        <View style={styles.languageContainer}>
          <LanguageSelector compact />
        </View>

        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.badge}>{t.home.badge}</Text>

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
          <Link href={{ pathname: "/register", params: { next: "create-club" } }} asChild>
            <AppButton
              title={t.home.primaryAction}
              accessibilityLabel={t.home.accessibility.createClub}
              style={styles.button}
            />
          </Link>

          <Link href={{ pathname: "/register", params: { next: "join-club" } }} asChild>
            <AppButton
              title={t.home.secondaryAction}
              variant="secondary"
              accessibilityLabel={t.home.accessibility.joinClub}
              style={styles.button}
            />
          </Link>

          <Link href="/login" asChild>
            <AppButton
              title={t.home.loginAction}
              variant="ghost"
              accessibilityLabel={t.home.accessibility.login}
              style={styles.button}
            />
          </Link>
        </View>

        <Text style={styles.footerText}>{t.home.footerText}</Text>
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
  languageContainer: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.lg,
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
