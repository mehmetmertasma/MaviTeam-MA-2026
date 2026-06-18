import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";

const t = translations[defaultLanguage];

const stats = [
  {
    label: t.dashboard.stats.athletes,
    value: "128",
  },
  {
    label: t.dashboard.stats.teams,
    value: "7",
  },
  {
    label: t.dashboard.stats.events,
    value: "24",
  },
];

const quickActions = [
  t.dashboard.actions.addAthlete,
  t.dashboard.actions.createTraining,
  t.dashboard.actions.createAnnouncement,
  t.dashboard.actions.viewSchedule,
];

const upcomingEvents = [
  {
    title: t.dashboard.exampleEvents.training,
    time: t.dashboard.exampleEventMeta.training,
    location: "Burhan Felek Spor Salonu",
  },
  {
    title: t.dashboard.exampleEvents.match,
    time: t.dashboard.exampleEventMeta.match,
    location: "Kadıköy Spor Kompleksi",
  },
  {
    title: t.dashboard.exampleEvents.meeting,
    time: t.dashboard.exampleEventMeta.meeting,
    location: "Kulüp Toplantı Salonu",
  },
];

export default function DashboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>{t.common.appName}</Text>

          <View>
            <Text style={styles.welcome}>Hoş geldin, Mert</Text>
            <Text style={styles.subtitle}>İstanbul Voleybol Kulübü</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp kontrol merkezi</Text>
          <Text style={styles.heroTitle}>{t.dashboard.title}</Text>
          <Text style={styles.heroSubtitle}>{t.dashboard.subtitle}</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.dashboard.sections.quickActions}
          </Text>

          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <View key={action} style={styles.actionCard}>
                <Text style={styles.actionText}>{action}</Text>
                <Text style={styles.actionMeta}>Yakında aktif olacak</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.dashboard.sections.upcomingEvents}
          </Text>

          <View style={styles.eventList}>
            {upcomingEvents.map((event) => (
              <View key={event.title} style={styles.eventCard}>
                <View style={styles.eventDot} />

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.dashboard.sections.clubOverview}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aktif sezon</Text>
            <Text style={styles.infoValue}>2026 Bahar</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kulüp rolün</Text>
            <Text style={styles.infoValue}>Kulüp yöneticisi</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Davet kodu</Text>
            <Text style={styles.infoValue}>TS-2026</Text>
          </View>
        </View>

        <Link href="/" asChild>
          <AppButton
            title="Ana sayfaya dön"
            variant="ghost"
            accessibilityLabel="Ana sayfaya dön"
            style={styles.backButton}
          />
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    padding: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
  },
  welcome: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontWeight: theme.fontWeights.semibold,
  },
  heroCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  heroLabel: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  actionText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  eventList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    marginTop: theme.spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  eventTime: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.muted,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  infoLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});