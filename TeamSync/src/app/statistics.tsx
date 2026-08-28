import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import type { AttendanceRecord, ScheduleEvent, TeamSyncAppData } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

const EMPTY_PLAYERS: PlayerRow[] = [];

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

function buildStats(appData: TeamSyncAppData, noTeamLabel: string): RosterStats | SelfStats {
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
      teamName: teamNames.length > 0 ? teamNames.join(", ") : noTeamLabel,
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

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    eyebrow: en ? "Performance center" : "Performans merkezi",
    pageTitle: en ? "Statistics" : "İstatistikler",
    pageSubtitle: en
      ? "View athlete attendance and this month's schedule summary in one screen."
      : "Sporcu katılımı ve bu ayki program özetini tek ekranda görüntüle.",
    loadingTitle: en ? "Loading..." : "Yükleniyor...",
    loadingDescription: en ? "Preparing statistics." : "İstatistikler hazırlanıyor.",
    totalAthletes: en ? "Total athletes" : "Toplam sporcu",
    averageAttendance: en ? "Average attendance" : "Ortalama katılım",
    matchesThisMonth: en ? "Matches this month" : "Bu ay maç",
    practicesThisMonth: en ? "Practices this month" : "Bu ay antrenman",
    athleteAttendanceTitle: en ? "Athlete attendance" : "Sporcu katılımı",
    athleteAttendanceSubtitle: en
      ? "Calculated from recent attendance records."
      : "Yakın zamandaki yoklama kayıtlarına göre hesaplanır.",
    athletesCount: (count: number) => (en ? `${count} athletes` : `${count} sporcu`),
    noAthletesTitle: en ? "No athletes yet" : "Henüz sporcu yok",
    noAthletesDescription: en
      ? "Attendance rates will appear here once athletes are added to a team."
      : "Bir takıma sporcu eklendiğinde katılım oranları burada görünecek.",
    searchPlaceholder: en ? "Search name or team..." : "İsim veya takım ara...",
    searchA11y: en ? "Search athletes" : "Sporcularda ara",
    noSearchMatchesTitle: en ? "No athletes match your search" : "Aramayla eşleşen sporcu yok",
    noSearchMatchesDescription: en ? "Try a different name or team." : "Farklı bir isim veya takım ile tekrar dene.",
    present: en ? "Present" : "Katıldı",
    absent: en ? "Absent" : "Katılmadı",
    totalRecords: en ? "Total records" : "Toplam kayıt",
    yourAttendanceTitle: en ? "Your attendance" : "Senin katılım durumun",
    yourAttendanceSubtitle: en
      ? "Calculated from recent attendance records."
      : "Yakın zamandaki yoklama kayıtlarına göre hesaplanır.",
    attendanceRate: en ? "Attendance rate" : "Katılım oranı",
    late: en ? "Late" : "Geç kaldı",
    excused: en ? "Excused" : "Mazeretli",
    noRecordsTitle: en ? "No attendance records yet" : "Henüz yoklama kaydın yok",
    noRecordsDescription: en
      ? "Records will appear here once you're checked in for a practice or match."
      : "Bir antrenman veya maçta yoklaman alındığında burada görünecek.",
    noTeam: en ? "No team" : "Takımsız",
  };
}

export default function StatisticsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const { appData } = useAppDataContext();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    return appData === null ? null : buildStats(appData, copy.noTeam);
  }, [appData, copy.noTeam]);

  const players = stats !== null && stats.mode === "roster" ? stats.players : EMPTY_PLAYERS;

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => matchesSearchQuery(searchQuery, player.name, player.teamName));
  }, [players, searchQuery]);

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      {stats === null ? (
        <Card>
          <EmptyState title={copy.loadingTitle} description={copy.loadingDescription} />
        </Card>
      ) : stats.mode === "roster" ? (
        <>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalAthletes}</Text>
              <Text style={styles.statLabel}>{copy.totalAthletes}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatRate(stats.attendanceRate)}</Text>
              <Text style={styles.statLabel}>{copy.averageAttendance}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.matchesThisMonth}</Text>
              <Text style={styles.statLabel}>{copy.matchesThisMonth}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.practicesThisMonth}</Text>
              <Text style={styles.statLabel}>{copy.practicesThisMonth}</Text>
            </Card>
          </View>

          <Card style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>{copy.athleteAttendanceTitle}</Text>
                <Text style={styles.sectionSubtitle}>
                  {copy.athleteAttendanceSubtitle}
                </Text>
              </View>
              <Text style={styles.statusPill}>{copy.athletesCount(stats.players.length)}</Text>
            </View>

            {stats.players.length === 0 ? (
              <EmptyState
                title={copy.noAthletesTitle}
                description={copy.noAthletesDescription}
              />
            ) : (
              <>
                {stats.players.length > 5 ? (
                  <SearchField
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={copy.searchPlaceholder}
                    accessibilityLabel={copy.searchA11y}
                    style={styles.searchField}
                  />
                ) : null}

                {filteredPlayers.length === 0 ? (
                  <EmptyState title={copy.noSearchMatchesTitle} description={copy.noSearchMatchesDescription} />
                ) : (
              <View style={styles.playerList}>
                {filteredPlayers.map((player) => (
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
                        <Text style={styles.infoLabel}>{copy.present}</Text>
                        <Text style={styles.infoValue}>{player.presentCount}</Text>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>{copy.absent}</Text>
                        <Text style={styles.infoValue}>{player.absentCount}</Text>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>{copy.totalRecords}</Text>
                        <Text style={styles.infoValue}>{player.recordCount}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
                )}
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.heroCard}>
            <Text style={styles.heroTitle}>{copy.yourAttendanceTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.yourAttendanceSubtitle}</Text>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatRate(stats.attendanceRate)}</Text>
              <Text style={styles.statLabel}>{copy.attendanceRate}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.presentCount}</Text>
              <Text style={styles.statLabel}>{copy.present}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.absentCount}</Text>
              <Text style={styles.statLabel}>{copy.absent}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.lateCount}</Text>
              <Text style={styles.statLabel}>{copy.late}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.excusedCount}</Text>
              <Text style={styles.statLabel}>{copy.excused}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.matchesThisMonth}</Text>
              <Text style={styles.statLabel}>{copy.matchesThisMonth}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.practicesThisMonth}</Text>
              <Text style={styles.statLabel}>{copy.practicesThisMonth}</Text>
            </Card>
          </View>

          {stats.recordCount === 0 ? (
            <Card>
              <EmptyState
                title={copy.noRecordsTitle}
                description={copy.noRecordsDescription}
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
    borderRadius: theme.radius.sm,
    overflow: "hidden",
  },
  searchField: { marginBottom: theme.spacing.md },
  playerList: { gap: theme.spacing.sm },
  playerCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
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
    borderRadius: theme.radius.sm,
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
