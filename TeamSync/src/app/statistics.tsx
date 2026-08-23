import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import type { AttendanceRecord, ScheduleEvent, TeamSyncAppData } from "@/types/teamSync";

type PlayerRow = {
  id: string;
  name: string;
  teamName: string;
  attendanceRate: number | null;
  presentCount: number;
  absentCount: number;
  recordCount: number;
};

type RosterStats = {
  mode: "roster";
  totalAthletes: number;
  attendanceRate: number | null;
  matchesThisMonth: number;
  practicesThisMonth: number;
  players: PlayerRow[];
};

type SelfStats = {
  mode: "self";
  attendanceRate: number | null;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  recordCount: number;
  matchesThisMonth: number;
  practicesThisMonth: number;
};

function isSameMonth(value: string, reference: Date) {
  const date = new Date(value);

  return !Number.isNaN(date.getTime())
    && date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth();
}

// Mirrors attendance.tsx's own definition (present + late counts as
// "attended") so the same session reads the same attendance rate on both
// screens.
function getAttendanceRate(records: AttendanceRecord[]) {
  if (records.length === 0) {
    return null;
  }

  const attendedCount = records.filter((record) => record.status === "present" || record.status === "late").length;

  return Math.round((attendedCount / records.length) * 100);
}

function formatRate(rate: number | null) {
  return rate === null ? "—" : `${rate}%`;
}

function countEventsThisMonth(
  scheduleEvents: ScheduleEvent[],
  type: ScheduleEvent["type"],
  visibleTeamIds: Set<string>,
  now: Date
) {
  return scheduleEvents.filter((event) => {
    return event.type === type
      && isSameMonth(event.startsAt, now)
      && (event.teamId === undefined || visibleTeamIds.has(event.teamId));
  }).length;
}

function buildStats(appData: TeamSyncAppData): RosterStats | SelfStats {
  const { currentUser, teams, users, scheduleEvents, attendanceRecords } = appData;
  const canViewRoster = currentUser.role === "clubAdmin" || currentUser.role === "coach";
  const now = new Date();

  const visibleTeams = canViewRoster ? teams : teams.filter((team) => currentUser.teamIds.includes(team.id));
  const visibleTeamIds = new Set(visibleTeams.map((team) => team.id));
  const matchesThisMonth = countEventsThisMonth(scheduleEvents, "match", visibleTeamIds, now);
  const practicesThisMonth = countEventsThisMonth(scheduleEvents, "practice", visibleTeamIds, now);

  if (!canViewRoster) {
    const ownRecords = attendanceRecords.filter((record) => record.userId === currentUser.id);

    return {
      mode: "self",
      attendanceRate: getAttendanceRate(ownRecords),
      presentCount: ownRecords.filter((record) => record.status === "present").length,
      absentCount: ownRecords.filter((record) => record.status === "absent").length,
      lateCount: ownRecords.filter((record) => record.status === "late").length,
      excusedCount: ownRecords.filter((record) => record.status === "excused").length,
      recordCount: ownRecords.length,
      matchesThisMonth,
      practicesThisMonth,
    };
  }

  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const athletes = users.filter((user) => user.role === "athlete" && user.status === "active");

  const players: PlayerRow[] = athletes.map((athlete) => {
    const records = attendanceRecords.filter((record) => record.userId === athlete.id);
    const teamNames = athlete.teamIds.map((teamId) => teamNameById.get(teamId)).filter((name): name is string => Boolean(name));

    return {
      id: athlete.id,
      name: athlete.fullName,
      teamName: teamNames.length > 0 ? teamNames.join(", ") : "Takımsız",
      attendanceRate: getAttendanceRate(records),
      presentCount: records.filter((record) => record.status === "present").length,
      absentCount: records.filter((record) => record.status === "absent").length,
      recordCount: records.length,
    };
  });

  return {
    mode: "roster",
    totalAthletes: athletes.length,
    attendanceRate: getAttendanceRate(attendanceRecords),
    matchesThisMonth,
    practicesThisMonth,
    players,
  };
}

export default function StatisticsScreen() {
  const { appData } = useAppDataContext();

  const stats = useMemo(() => {
    return appData === null ? null : buildStats(appData);
  }, [appData]);

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Performans merkezi"
        title="İstatistikler"
        subtitle="Sporcu katılımı ve bu ayki program özetini tek ekranda görüntüle."
      />

      {stats === null ? (
        <Card>
          <EmptyState title="Yükleniyor..." description="İstatistikler hazırlanıyor." />
        </Card>
      ) : stats.mode === "roster" ? (
        <>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalAthletes}</Text>
              <Text style={styles.statLabel}>Toplam sporcu</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatRate(stats.attendanceRate)}</Text>
              <Text style={styles.statLabel}>Ortalama katılım</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.matchesThisMonth}</Text>
              <Text style={styles.statLabel}>Bu ay maç</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.practicesThisMonth}</Text>
              <Text style={styles.statLabel}>Bu ay antrenman</Text>
            </Card>
          </View>

          <Card style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Sporcu katılımı</Text>
                <Text style={styles.sectionSubtitle}>
                  Yakın zamandaki yoklama kayıtlarına göre hesaplanır.
                </Text>
              </View>
              <Text style={styles.statusPill}>{stats.players.length} sporcu</Text>
            </View>

            {stats.players.length === 0 ? (
              <EmptyState
                title="Henüz sporcu yok"
                description="Bir takıma sporcu eklendiğinde katılım oranları burada görünecek."
              />
            ) : (
              <View style={styles.playerList}>
                {stats.players.map((player) => (
                  <View key={player.id} style={styles.playerCard}>
                    <View style={styles.playerTopRow}>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerTeam}>{player.teamName}</Text>
                      </View>
                      <Text style={styles.attendanceBadge}>{formatRate(player.attendanceRate)}</Text>
                    </View>

                    <View style={styles.infoGrid}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Katıldı</Text>
                        <Text style={styles.infoValue}>{player.presentCount}</Text>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Katılmadı</Text>
                        <Text style={styles.infoValue}>{player.absentCount}</Text>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>Toplam kayıt</Text>
                        <Text style={styles.infoValue}>{player.recordCount}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.heroCard}>
            <Text style={styles.heroTitle}>Senin katılım durumun</Text>
            <Text style={styles.heroSubtitle}>Yakın zamandaki yoklama kayıtlarına göre hesaplanır.</Text>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatRate(stats.attendanceRate)}</Text>
              <Text style={styles.statLabel}>Katılım oranı</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.presentCount}</Text>
              <Text style={styles.statLabel}>Katıldı</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.absentCount}</Text>
              <Text style={styles.statLabel}>Katılmadı</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.lateCount}</Text>
              <Text style={styles.statLabel}>Geç kaldı</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.excusedCount}</Text>
              <Text style={styles.statLabel}>Mazeretli</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.matchesThisMonth}</Text>
              <Text style={styles.statLabel}>Bu ay maç</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.practicesThisMonth}</Text>
              <Text style={styles.statLabel}>Bu ay antrenman</Text>
            </Card>
          </View>

          {stats.recordCount === 0 ? (
            <Card>
              <EmptyState
                title="Henüz yoklama kaydın yok"
                description="Bir antrenman veya maçta yoklaman alındığında burada görünecek."
              />
            </Card>
          ) : null}
        </>
      )}
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
    flexBasis: 100,
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
});
