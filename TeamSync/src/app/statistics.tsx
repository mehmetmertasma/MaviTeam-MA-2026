import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type PlayerStat = {
  id: number;
  name: string;
  team: string;
  attendanceRate: string;
  matchesPlayed: number;
  practicesAttended: number;
  coachNote: string;
};

const playerStats: PlayerStat[] = [
  {
    id: 1,
    name: "Mert Asma",
    team: "U16 Erkek",
    attendanceRate: "92%",
    matchesPlayed: 8,
    practicesAttended: 22,
    coachNote: "Güçlü hücum, servis istikrarı gelişiyor.",
  },
  {
    id: 2,
    name: "Efe Yılmaz",
    team: "U16 Erkek",
    attendanceRate: "88%",
    matchesPlayed: 7,
    practicesAttended: 20,
    coachNote: "Takım iletişimi iyi, savunma pozisyonu gelişiyor.",
  },
  {
    id: 3,
    name: "Deniz Kaya",
    team: "U16 Erkek",
    attendanceRate: "76%",
    matchesPlayed: 6,
    practicesAttended: 17,
    coachNote: "Antrenman katılımı artırılmalı.",
  },
];

const teamStats = [
  {
    label: "Toplam sporcu",
    value: "128",
  },
  {
    label: "Ortalama katılım",
    value: "86%",
  },
  {
    label: "Bu ay maç",
    value: "12",
  },
  {
    label: "Bu ay antrenman",
    value: "34",
  },
];

export default function StatisticsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>İstatistikler</Text>
            <Text style={styles.pageSubtitle}>
              Sporcu katılımı, maç sayıları, antrenman takibi ve koç notlarını
              tek ekranda görüntüle.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Performans merkezi</Text>

          <Text style={styles.heroTitle}>Kulüp ve sporcu istatistikleri</Text>

          <Text style={styles.heroSubtitle}>
            Adminler tüm kulüp verilerini görebilir. Koçlar kendi takımlarını,
            veliler ve sporcular ise sadece kendilerine ait bilgileri görecek.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {teamStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Sporcu performansı</Text>
              <Text style={styles.sectionSubtitle}>
                Şimdilik demo veri kullanıyoruz. Firebase eklendiğinde bu
                bilgiler gerçek yoklama, maç ve antrenman kayıtlarından gelecek.
              </Text>
            </View>

            <Text style={styles.countText}>{playerStats.length} sporcu</Text>
          </View>

          <View style={styles.playerList}>
            {playerStats.map((player) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerTopRow}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerTeam}>{player.team}</Text>
                  </View>

                  <View style={styles.attendanceBadge}>
                    <Text style={styles.attendanceValue}>
                      {player.attendanceRate}
                    </Text>
                    <Text style={styles.attendanceLabel}>Katılım</Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Maç</Text>
                    <Text style={styles.infoValue}>{player.matchesPlayed}</Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Antrenman</Text>
                    <Text style={styles.infoValue}>
                      {player.practicesAttended}
                    </Text>
                  </View>
                </View>

                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Koç notu</Text>
                  <Text style={styles.noteText}>{player.coachNote}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="ghost"
            accessibilityLabel="Dashboard sayfasına dön"
            style={styles.backButton}
          />
        </Link>
      </View>
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
  pageTitle: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
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
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 180,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  playerList: {
    gap: theme.spacing.md,
  },
  playerCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  playerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  playerTeam: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  attendanceBadge: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    minWidth: 84,
  },
  attendanceValue: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.brand,
  },
  attendanceLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
  },
  infoGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  noteBox: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  noteLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});