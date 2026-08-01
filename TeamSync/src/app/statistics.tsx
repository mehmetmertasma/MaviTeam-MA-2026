import { StyleSheet, Text, View } from "react-native";

import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { theme } from "@/constants/theme";

const teamStats = [
  { label: "Toplam sporcu", value: "128" },
  { label: "Ortalama katılım", value: "86%" },
  { label: "Bu ay maç", value: "12" },
  { label: "Bu ay antrenman", value: "34" },
];

const playerStats = [
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

export default function StatisticsScreen() {
  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Performans merkezi"
        title="İstatistikler"
        subtitle="Sporcu katılımı, maç sayıları ve koç notlarını tek ekranda görüntüle."
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Kulüp ve sporcu istatistikleri</Text>
        <Text style={styles.heroSubtitle}>
          Gerçek sistemde bu veriler yoklama, program ve maç kayıtlarından otomatik oluşacak.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        {teamStats.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Sporcu performansı</Text>
            <Text style={styles.sectionSubtitle}>
              Şimdilik demo veri kullanıyoruz. Firebase eklendiğinde gerçek kayıtlar burada görünecek.
            </Text>
          </View>
          <Text style={styles.statusPill}>{playerStats.length} sporcu</Text>
        </View>

        <View style={styles.playerList}>
          {playerStats.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerTopRow}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerTeam}>{player.team}</Text>
                </View>
                <Text style={styles.attendanceBadge}>{player.attendanceRate}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Maç</Text>
                  <Text style={styles.infoValue}>{player.matchesPlayed}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Antrenman</Text>
                  <Text style={styles.infoValue}>{player.practicesAttended}</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Koç notu</Text>
                <Text style={styles.noteText}>{player.coachNote}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  heroTitle: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
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
    flexBasis: 145,
  },
  statValue: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.bold,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  playerList: { gap: theme.spacing.md },
  playerCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
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
  playerInfo: { flex: 1 },
  playerName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  playerTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
  },
  attendanceBadge: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  infoBox: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
  },
  noteBox: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginTop: theme.spacing.md,
  },
  noteLabel: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
});
