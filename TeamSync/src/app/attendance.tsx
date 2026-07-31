import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { teamSyncService } from "@/services/teamSyncService";
import type { AttendanceStatus, ScheduleEvent, Team, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type AttendanceOption = {
  value: AttendanceStatus;
  label: string;
};

const attendanceOptions: AttendanceOption[] = [
  { value: "present", label: "Katıldı" },
  { value: "absent", label: "Katılmadı" },
  { value: "late", label: "Geç kaldı" },
  { value: "excused", label: "Mazeretli" },
];

const EMPTY_TEAMS: Team[] = [];
const EMPTY_USERS: UserProfile[] = [];
const EMPTY_EVENTS: ScheduleEvent[] = [];

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
}

function formatEventTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saat yok";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventTypeLabel(type: ScheduleEvent["type"]) {
  if (type === "practice") {
    return "Antrenman";
  }

  if (type === "match") {
    return "Maç";
  }

  return "Toplantı";
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "TS";
}

function getTeamMembers(team: Team | undefined, users: UserProfile[]) {
  if (team === undefined) {
    return [];
  }

  return users.filter((user) => team.memberIds.includes(user.id) && user.status === "active");
}

function getTeamEvents(teamId: string, events: ScheduleEvent[]) {
  return [...events]
    .filter((event) => event.teamId === teamId)
    .sort((firstEvent, secondEvent) => new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime());
}

function getSavedStatus(appData: TeamSyncAppData | null, userId: string, teamId: string, sessionDate: string) {
  return appData?.attendanceRecords.find((record) => {
    return record.userId === userId && record.teamId === teamId && record.sessionDate === sessionDate;
  })?.status;
}

export default function AttendanceScreen() {
  const { appData, setAppData } = useAppDataContext();
  const [selectedTeamIdState, setSelectedTeamId] = useState("");
  const [selectedEventIdState, setSelectedEventId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceStatus>>({});
  const [lastSavedAt, setLastSavedAt] = useState("Henüz kaydedilmedi");
  const [statusMessage, setStatusMessage] = useState("Önce takım ve antrenman seçerek yoklama alabilirsin.");

  const teams = appData?.teams ?? EMPTY_TEAMS;
  const users = appData?.users ?? EMPTY_USERS;
  const scheduleEvents = appData?.scheduleEvents ?? EMPTY_EVENTS;
  const selectedTeamId = teams.some((team) => team.id === selectedTeamIdState) ? selectedTeamIdState : teams[0]?.id ?? "";
  const selectedEventId = scheduleEvents.some((event) => event.id === selectedEventIdState) ? selectedEventIdState : "";

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === selectedTeamId);
  }, [selectedTeamId, teams]);

  const availableEvents = useMemo(() => {
    if (selectedTeamId === "") {
      return EMPTY_EVENTS;
    }

    return getTeamEvents(selectedTeamId, scheduleEvents);
  }, [selectedTeamId, scheduleEvents]);

  const selectedEvent = useMemo(() => {
    return availableEvents.find((event) => event.id === selectedEventId);
  }, [availableEvents, selectedEventId]);

  const teamMembers = useMemo(() => {
    return getTeamMembers(selectedTeam, users);
  }, [selectedTeam, users]);

  const attendanceSummary = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    if (selectedTeam === undefined || selectedEvent === undefined) {
      return { ...counts, totalCount: 0, attendanceRate: 0 };
    }

    teamMembers.forEach((member) => {
      const status = attendanceDraft[member.id]
        ?? getSavedStatus(appData, member.id, selectedTeam.id, selectedEvent.startsAt)
        ?? "present";
      counts[status] += 1;
    });

    const totalCount = teamMembers.length;
    const activeCount = counts.present + counts.late;
    const attendanceRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    return { ...counts, totalCount, attendanceRate };
  }, [appData, attendanceDraft, selectedEvent, selectedTeam, teamMembers]);

  function selectTeam(team: Team) {
    setSelectedTeamId(team.id);
    setSelectedEventId("");
    setAttendanceDraft({});
    setStatusMessage(`${team.name} seçildi. Şimdi antrenman veya maç oturumu seç.`);
  }

  function selectEvent(event: ScheduleEvent) {
    setSelectedEventId(event.id);
    setAttendanceDraft({});
    setStatusMessage(`${event.title} için yoklama açıldı.`);
  }

  function updateAttendanceStatus(userId: string, newStatus: AttendanceStatus) {
    setAttendanceDraft((currentDraft) => ({
      ...currentDraft,
      [userId]: newStatus,
    }));

    setStatusMessage("Yoklama güncellendi. Kaydetmeyi unutma.");
  }

  async function handleSaveAttendance() {
    if (appData === null || selectedTeam === undefined || selectedEvent === undefined) {
      setStatusMessage("Yoklama kaydetmek için önce takım ve antrenman seçmelisin.");
      return;
    }

    if (teamMembers.length === 0) {
      setStatusMessage("Bu takımda yoklama alınacak aktif kişi yok.");
      return;
    }

    try {
      const records = teamMembers.map((member) => ({
        userId: member.id,
        status: attendanceDraft[member.id]
          ?? getSavedStatus(appData, member.id, selectedTeam.id, selectedEvent.startsAt)
          ?? "present",
      }));

      const nextAppData = await teamSyncService.saveAttendance({
        teamId: selectedTeam.id,
        sessionDate: selectedEvent.startsAt,
        records,
      });

      const savedTime = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      setAppData(nextAppData);
      setAttendanceDraft({});
      setLastSavedAt(`${selectedEvent.title} · ${savedTime}`);
      setStatusMessage("Yoklama seçilen antrenman için kaydedildi.");
    } catch {
      setStatusMessage("Yoklama kaydedilirken bir sorun oluştu.");
    }
  }

  function resetCurrentAttendance() {
    setAttendanceDraft({});
    setLastSavedAt("Henüz kaydedilmedi");
    setStatusMessage("Bu oturumdaki değişiklikler sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Yoklama</Text>
          <Text style={styles.pageSubtitle}>
            Önce takım seç, sonra hangi antrenman veya maç için yoklama aldığını seç.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Yoklama akışı</Text>
          <Text style={styles.heroTitle}>Takım + oturum bazlı yoklama</Text>
          <Text style={styles.heroSubtitle}>
            Yoklama artık tek bir sporcu listesi değil; seçilen takım ve programdaki belirli antrenman/maç üzerinden kaydedilir.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.present}</Text>
            <Text style={styles.statLabel}>Katıldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.absent}</Text>
            <Text style={styles.statLabel}>Katılmadı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.late}</Text>
            <Text style={styles.statLabel}>Geç kaldı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendanceSummary.excused}</Text>
            <Text style={styles.statLabel}>Mazeretli</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>1. Takım seç</Text>
              <Text style={styles.sectionSubtitle}>Yoklama hangi takım için alınacak?</Text>
            </View>
            <Text style={styles.statusPill}>{teams.length} takım</Text>
          </View>

          {teams.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Henüz takım yok</Text>
              <Text style={styles.emptyText}>Önce Takımlar ekranından takım oluşturmalısın.</Text>
            </View>
          ) : (
            <View style={styles.teamGrid}>
              {teams.map((team) => {
                const isSelected = selectedTeamId === team.id;
                const teamEventCount = getTeamEvents(team.id, scheduleEvents).length;
                const teamMemberCount = getTeamMembers(team, users).length;

                return (
                  <Pressable
                    key={team.id}
                    onPress={() => selectTeam(team)}
                    style={({ pressed }) => [
                      styles.teamCard,
                      isSelected ? styles.teamCardSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>{team.ageGroup}</Text>
                    <View style={styles.teamStatsRow}>
                      <Text style={styles.teamStat}>{teamMemberCount} kişi</Text>
                      <Text style={styles.teamStat}>{teamEventCount} oturum</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>2. Antrenman / maç seç</Text>
              <Text style={styles.sectionSubtitle}>
                Yoklama hangi gün ve hangi program için alınacak?
              </Text>
            </View>
            <Text style={styles.statusPill}>{availableEvents.length} oturum</Text>
          </View>

          {selectedTeam === undefined ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Takım seçilmedi</Text>
              <Text style={styles.emptyText}>Önce yukarıdan bir takım seçmelisin.</Text>
            </View>
          ) : availableEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Bu takım için program yok</Text>
              <Text style={styles.emptyText}>Program ekranından bu takıma antrenman veya maç eklenince burada görünecek.</Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {availableEvents.map((event) => {
                const isSelected = selectedEventId === event.id;

                return (
                  <Pressable
                    key={event.id}
                    onPress={() => selectEvent(event)}
                    style={({ pressed }) => [
                      styles.eventCard,
                      isSelected ? styles.eventCardSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.eventDateBox}>
                      <Text style={styles.eventDateText}>{formatEventDate(event.startsAt)}</Text>
                      <Text style={styles.eventTimeText}>{formatEventTime(event.startsAt)}</Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventType}>{getEventTypeLabel(event.type)}</Text>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventMeta}>{event.location}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>3. Yoklama al</Text>
              <Text style={styles.sectionSubtitle}>
                {selectedTeam?.name ?? "Takım seçilmedi"} · {selectedEvent?.title ?? "Oturum seçilmedi"} · Son kayıt: {lastSavedAt}
              </Text>
            </View>
            <Text style={styles.statusPill}>%{attendanceSummary.attendanceRate} katılım</Text>
          </View>

          {selectedTeam === undefined || selectedEvent === undefined ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Yoklama hazır değil</Text>
              <Text style={styles.emptyText}>Sporcu listesi için önce takım ve antrenman/maç seç.</Text>
            </View>
          ) : teamMembers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Bu takımda aktif kişi yok</Text>
              <Text style={styles.emptyText}>Takıma üye eklenince yoklama listesi burada görünecek.</Text>
            </View>
          ) : (
            <View style={styles.attendanceList}>
              {teamMembers.map((member) => {
                const currentStatus = attendanceDraft[member.id]
                  ?? getSavedStatus(appData, member.id, selectedTeam.id, selectedEvent.startsAt)
                  ?? "present";

                return (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberTopRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(member.fullName)}</Text>
                      </View>

                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.fullName}</Text>
                        <Text style={styles.memberMeta}>{member.email}</Text>
                      </View>

                      <Text style={styles.currentStatus}>
                        {attendanceOptions.find((option) => option.value === currentStatus)?.label}
                      </Text>
                    </View>

                    <View style={styles.statusGrid}>
                      {attendanceOptions.map((option) => {
                        const isSelected = currentStatus === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => updateAttendanceStatus(member.id, option.value)}
                            style={({ pressed }) => [
                              styles.statusButton,
                              isSelected ? styles.statusButtonSelected : null,
                              pressed ? styles.pressed : null,
                            ]}
                          >
                            <Text style={[styles.statusButtonText, isSelected ? styles.statusButtonTextSelected : null]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.actionRow}>
            <AppButton title="Yoklamayı kaydet" onPress={handleSaveAttendance} style={styles.actionButton} />
            <AppButton title="Değişiklikleri sıfırla" variant="ghost" onPress={resetCurrentAttendance} style={styles.actionButton} />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontSize: theme.fontSizes.lg,
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
    overflow: "hidden",
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
    flexBasis: 145,
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },
  teamGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  teamCard: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  teamCardSelected: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  teamName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  teamMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  teamStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  teamStat: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden",
  },
  eventList: { gap: theme.spacing.md },
  eventCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  eventCardSelected: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  eventDateBox: {
    width: 92,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  eventDateText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  eventTimeText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  eventInfo: { flex: 1 },
  eventType: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  emptyBox: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  attendanceList: { gap: theme.spacing.md },
  memberCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  memberInfo: { flex: 1 },
  memberName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  memberMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  currentStatus: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statusButton: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
  },
  statusButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  statusButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  statusButtonTextSelected: { color: theme.colors.text.inverse },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  actionButton: { minWidth: 170, flexGrow: 1 },
  statusText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
