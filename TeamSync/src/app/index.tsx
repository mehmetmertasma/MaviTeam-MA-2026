import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";

const features = [
  "Kulüp sahipleri kendi kulübünü oluşturabilir",
  "Oyuncu, veli ve koçlar takım kodu ile katılabilir",
  "Antrenman, maç ve duyurular tek yerden takip edilir",
  "Web, iPhone ve Android için ortak deneyim",
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard centered style={styles.card}>
        <Text style={styles.logo}>TeamSync</Text>

        <Text style={styles.badge}>Spor kulüpleri için yönetim platformu</Text>

        <Text style={styles.title}>Kulübünüzü tek yerden yönetin</Text>

        <Text style={styles.subtitle}>
          TeamSync; kulüp sahipleri, koçlar, veliler ve sporcular için takım
          yönetimini daha kolay hale getirir.
        </Text>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>TeamSync ile neler yapacağız?</Text>

          {features.map((feature) => (
            <Text key={feature} style={styles.featureText}>
              ✓ {feature}
            </Text>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <Link href="/create-club" asChild>
            <AppButton
              title="Kulüp oluştur"
              accessibilityLabel="Yeni kulüp oluşturma sayfasına git"
              style={styles.button}
            />
          </Link>

          <Link href="/join-club" asChild>
            <AppButton
              title="Takım kodu ile katıl"
              variant="secondary"
              accessibilityLabel="Takım kodu ile kulübe katılma sayfasına git"
              style={styles.button}
            />
          </Link>
        </View>

        <Text style={styles.footerText}>
          E-mail veya şifre sistemi daha sonra Firebase ile eklenecek. Şimdilik
          ana giriş sistemi takım kodudur.
        </Text>
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