import { Link, router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ScreenCard } from "@/components/ScreenCard";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen} overScrollMode="never">
      <ScreenCard centered style={styles.card}>
        <View style={styles.topHeader}>
          <Text style={styles.headerLogo}>{t.common.appName}</Text>
          <LanguageSelector compact />
        </View>

        <View style={styles.headingSection}>
          <Text style={styles.title}>{t.home.title}</Text>
          <Text style={styles.subtitle}>{t.home.subtitle}</Text>
        </View>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>{t.home.featuresTitle}</Text>

          <View style={styles.featureList}>
            {t.home.features.map((feature) => (
              <Text key={feature} style={styles.featureText}>
                ✓ {feature}
              </Text>
            ))}
          </View>
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

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t.home.footerText}</Text>

          <Text style={styles.legalLinksText}>
            <Text style={styles.legalLink} onPress={() => router.push("/privacy-policy" as never)}>
              {t.home.legalPrivacy}
            </Text>
            {t.home.legalAnd}
            <Text style={styles.legalLink} onPress={() => router.push("/terms-of-service" as never)}>
              {t.home.legalTerms}
            </Text>
          </Text>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  card: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  topHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  headerLogo: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.brand.primary,
  },
  headingSection: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  badge: {
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.lineHeights["2xl"],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.lineHeights.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  featureBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  featureTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xxs,
  },
  featureList: {
    gap: 3,
  },
  featureText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.xs,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.xs,
  },
  button: {
    width: "100%",
  },
  footerContainer: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  footerText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: "center",
    fontWeight: theme.fontWeights.medium,
    lineHeight: theme.lineHeights.xs,
  },
  legalLinksText: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: "center",
  },
  legalLink: {
    color: theme.colors.text.brand,
    fontWeight: theme.fontWeights.semibold,
  },
});
