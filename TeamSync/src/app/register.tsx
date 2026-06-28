import { ScrollView, StyleSheet, Text } from "react-native";

import { ScreenCard } from "@/components/ScreenCard";
import { theme } from "@/constants/theme";

export default function RegisterScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>TeamSync</Text>
        <Text style={styles.title}>Hesap oluştur</Text>
        <Text style={styles.subtitle}>
          Kayıt akışı burada başlayacak. Firebase aşamasında gerçek giriş sistemi bağlanacak.
        </Text>
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
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.lineHeights.xl,
  },
});