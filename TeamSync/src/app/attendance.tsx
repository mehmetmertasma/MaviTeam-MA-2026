import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
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

const attendanceToneByStatus: Record<AttendanceStatus, StatusBadgeTone> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

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
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionLocation, setNewSessionLocation] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [pendingRemoveEventId, setPendingRemoveEventId] = useState("");

  const currentUser = appData?.currentUser;
  const canTakeAttendance = currentUser?.role === "clubAdmin" || currentUser?.role === "coach";

  const allTeams = appData?.teams ?? EMPTY_TEAMS;
  const teams = useMemo(() => {
    if (canTakeAttendance || currentUser === undefined) {
      return allTeams;
    }

    return allTeams.filter((team) => currentUser.teamIds.includes(team.id));
  }, [allTeams, canTakeAttendance, currentUser]);

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
    setShowCreateSession(false);
    setStatusMessage(`${team.name} seçildi. Şimdi antrenman veya maç oturumu seç.`);
  }

  function selectEvent(event: ScheduleEvent) {
    setSelectedEventId(event.id);
    setAttendanceDraft({});
    setStatusMessage(`${event.title} için yoklama açıldı.`);
  }

  async function handleRemoveEvent(event: ScheduleEvent) {
    if (pendingRemoveEventId !== event.id) {
      setPendingRemoveEventId(event.id);
      setStatusMessage(`${event.title} silinecek. Eminsen tekrar Sil'e bas.`);
      return;
    }

    try {
      const nextAppData = await teamSyncService.removeScheduleEvent(event.id);
      setAppData(nextAppData);
      setPendingRemoveEventId("");

      if (selectedEventId === event.id) {
        setSelectedEventId("");
      }

      setStatusMessage(`${event.title} silindi.`);
    } catch {
      setStatusMessage("Oturum silinirken bir sorun oluştu.");
    }
  }

  async function handleCreateSession() {
    if (appData === null || selectedTeam === undefined) {
      setStatusMessage("Oturum oluşturmak için önce yukarıdan bir takım seçmelisin.");
      return;
    }

    const trimmedTitle = newSessionTitle.trim();

    if (trimmedTitle.length === 0) {
      setStatusMessage("Oturum için bir başlık yazmalısın. Örn. U17 Antrenmanı.");
      return;
    }

    try {
      setIsCreatingSession(true);

      const nextAppData = await teamSyncService.createScheduleEvent({
        clubId: selectedTeam.clubId,
        teamId: selectedTeam.id,
        title: trimmedTitle,
        type: "practice",
        startsAt: new Date().toISOString(),
        location: newSessionLocation.trim() || "Belirtilmedi",
        createdByUserId: appData.currentUser.id,
      });

      setAppData(nextAppData);

      const createdEvent = [...nextAppData.scheduleEvents]
        .filter((event) => event.teamId === selectedTeam.id)
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())[0];

      if (createdEvent !== undefined) {
        setSelectedEventId(createdEvent.id);
      }

      setNewSessionTitle("");
      setNewSessionLocation("");
      setShowCreateSession(false);
      setStatusMessage(`${selectedTeam.name} için ${trimmedTitle} oturumu oluşturuldu. Şimdi yoklama alabilirsin.`);
    } catch {
      setStatusMessage("Oturum oluşturulurken bir sorun oluştu.");
    } finally {
      setIsCreatingSession(false);
    }
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
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Yoklama akışı"
        title="Yoklama"
        subtitle={
          canTakeAttendance
            ? "Önce takım seç, sonra hangi antrenman veya maç için yoklama aldığını seç."
            : "Takımını ve antrenman/maçı seç, katılım durumunu buradan görebilirsin."
        }
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Takım + oturum bazlı yoklama</Text>
        <Text style={styles.heroSubtitle}>
          Yoklama artık tek bir sporcu listesi değil; seçilen takım ve programdaki belirli antrenman/maç üzerinden kaydedilir.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.present}</Text>
          <Text style={styles.statLabel}>Katıldı</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.absent}</Text>
          <Text style={styles.statLabel}>Katılmadı</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.late}</Text>
          <Text style={styles.statLabel}>Geç kaldı</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.excused}</Text>
          <Text style={styles.statLabel}>Mazeretli</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>1. Takım seç</Text>
            <Text style={styles.sectionSubtitle}>
              {canTakeAttendance ? "Yoklama hangi takım için alınacak?" : "Yoklamasını görmek istediğin takımı seç."}
            </Text>
          </View>
          <Text style={styles.statusPill}>{teams.length} takım</Text>
        </View>

        {teams.length === 0 ? (
          canTakeAttendance ? (
            <EmptyState title="Henüz takım yok" description="Önce Takımlar ekranından takım oluşturmalısın." />
          ) : (
            <EmptyState title="Henüz bir takıma bağlı değilsin" description="Bir takıma eklendiğinde yoklama durumunu burada görebileceksin." />
          )
        ) : (
          <View>
            <Pressable
              onPress={() => setShowTeamPicker((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.teamDropdownButton, pressed ? styles.pressed : null]}
            >
              <View style={styles.teamDropdownTextArea}>
                <Text style={styles.teamDropdownLabel}>Takım</Text>
                <Text style={styles.teamDropdownValue}>{selectedTeam?.name ?? "Takım seç"}</Text>
              </View>
              <Text style={styles.teamDropdownChevron}>{showTeamPicker ? "▲" : "▼"}</Text>
            </Pressable>

            {showTeamPicker ? (
              <View style={styles.teamDropdownList}>
                {teams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  const teamMemberCount = getTeamMembers(team, users).length;

                  return (
                    <Pressable
                      key={team.id}
                      onPress={() => {
                        selectTeam(team);
                        setShowTeamPicker(false);
                      }}
                      style={({ pressed }) => [
                        styles.teamDropdownRow,
                        isSelected ? styles.teamDropdownRowSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <View style={styles.teamDropdownRowTextArea}>
                        <Text style={[styles.teamDropdownRowText, isSelected ? styles.teamDropdownRowTextSelected : null]}>
                          {team.name}
                        </Text>
                        <Text style={styles.teamDropdownRowMeta}>{team.ageGroup}</Text>
                      </View>
                      <Text style={[styles.teamDropdownRowCount, isSelected ? styles.teamDropdownRowTextSelected : null]}>
                        {teamMemberCount} kişi
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>2. Antrenman / maç seç</Text>
            <Text style={styles.sectionSubtitle}>
              Yoklama hangi gün ve hangi program için alınacak?
            </Text>
          </View>
          <Text style={styles.statusPill}>{availableEvents.length} oturum</Text>
        </View>

        {canTakeAttendance && selectedTeam !== undefined ? (
          <AppButton
            title={showCreateSession ? "Kapat" : "Yeni oturum oluştur"}
            variant="secondary"
            onPress={() => setShowCreateSession((currentValue) => !currentValue)}
            style={styles.newSessionButton}
          />
        ) : null}

        {showCreateSession && selectedTeam !== undefined ? (
          <Card variant="subtle" style={styles.createSessionBox}>
            <Text style={styles.createSessionTitle}>{selectedTeam.name} için yeni oturum</Text>
            <Text style={styles.createSessionSubtitle}>
              Oturum şimdi (bugünün tarihi ve saati) için oluşturulur. Farklı bir tarih planlamak istersen Program ekranını kullan.
            </Text>

            <TextField
              label="Oturum adı"
              value={newSessionTitle}
              onChangeText={setNewSessionTitle}
              placeholder="Örn. U17 Antrenmanı"
              containerStyle={styles.createSessionField}
            />

            <TextField
              label="Konum (opsiyonel)"
              value={newSessionLocation}
              onChangeText={setNewSessionLocation}
              placeholder="Örn. Kulüp Salonu"
              containerStyle={styles.createSessionField}
            />

            <AppButton
              title={isCreatingSession ? "Oluşturuluyor..." : "Oturumu oluştur"}
              onPress={handleCreateSession}
              disabled={isCreatingSession}
              style={styles.createSessionButton}
            />
          </Card>
        ) : null}

        {selectedTeam === undefined ? (
          <EmptyState title="Takım seçilmedi" description="Önce yukarıdan bir takım seçmelisin." />
        ) : availableEvents.length === 0 ? (
          <EmptyState
            title="Bu takım için program yok"
            description={
              canTakeAttendance
                ? "Yukarıdaki 'Yeni oturum oluştur' butonuyla hemen bir antrenman/maç oturumu açabilirsin."
                : "Program ekranından bu takıma antrenman veya maç eklenince burada görünecek."
            }
          />
        ) : (
          <View style={styles.eventList}>
            {availableEvents.map((event) => {
              const isSelected = selectedEventId === event.id;

              return (
                <View key={event.id} style={[styles.eventCard, isSelected ? styles.eventCardSelected : null]}>
                  <Pressable
                    onPress={() => selectEvent(event)}
                    style={({ pressed }) => [styles.eventMainArea, pressed ? styles.pressed : null]}
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

                  {canTakeAttendance ? (
                    <Pressable
                      onPress={() => handleRemoveEvent(event)}
                      style={({ pressed }) => [styles.eventDeleteButton, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.eventDeleteButtonText}>
                        {pendingRemoveEventId === event.id ? "Emin misin?" : "Sil"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{canTakeAttendance ? "3. Yoklama al" : "3. Yoklama durumu"}</Text>
            <Text style={styles.sectionSubtitle}>
              {canTakeAttendance
                ? `${selectedTeam?.name ?? "Takım seçilmedi"} · ${selectedEvent?.title ?? "Oturum seçilmedi"} · Son kayıt: ${lastSavedAt}`
                : `${selectedTeam?.name ?? "Takım seçilmedi"} · ${selectedEvent?.title ?? "Oturum seçilmedi"}`}
            </Text>
          </View>
          <Text style={styles.statusPill}>%{attendanceSummary.attendanceRate} katılım</Text>
        </View>

        {selectedTeam === undefined || selectedEvent === undefined ? (
          <EmptyState title="Yoklama hazır değil" description="Sporcu listesi için önce takım ve antrenman/maç seç." />
        ) : teamMembers.length === 0 ? (
          <EmptyState title="Bu takımda aktif kişi yok" description="Takıma üye eklenince yoklama listesi burada görünecek." />
        ) : (
          <View style={styles.attendanceList}>
            {teamMembers.map((member) => {
              const savedStatus = getSavedStatus(appData, member.id, selectedTeam.id, selectedEvent.startsAt);
              const currentStatus = attendanceDraft[member.id] ?? savedStatus ?? "present";
              const displayStatus = canTakeAttendance ? currentStatus : savedStatus;

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

                    <StatusBadge
                      label={displayStatus === undefined ? "Kaydedilmedi" : attendanceOptions.find((option) => option.value === displayStatus)?.label ?? ""}
                      tone={displayStatus === undefined ? "neutral" : attendanceToneByStatus[displayStatus]}
                    />
                  </View>

                  {canTakeAttendance ? (
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
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {canTakeAttendance ? (
          <View style={styles.actionRow}>
            <AppButton title="Yoklamayı kaydet" onPress={handleSaveAttendance} style={styles.actionButton} />
            <AppButton title="Değişiklikleri sıfırla" variant="ghost" onPress={resetCurrentAttendance} style={styles.actionButton} />
          </View>
        ) : null}

        {canTakeAttendance ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  newSessionButton: { alignSelf: "flex-start", marginBottom: theme.spacing.lg },
  createSessionBox: { marginBottom: theme.spacing.xl },
  createSessionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  createSessionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.lg,
  },
  createSessionField: { marginBottom: theme.spacing.lg },
  createSessionButton: { alignSelf: "flex-start" },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  teamDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  teamDropdownTextArea: { flex: 1 },
  teamDropdownLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.medium,
    textTransform: "uppercase",
    marginBottom: theme.spacing.xs,
  },
  teamDropdownValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  teamDropdownChevron: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginLeft: theme.spacing.md,
  },
  teamDropdownList: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: "hidden",
  },
  teamDropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  teamDropdownRowSelected: { backgroundColor: theme.colors.brand.primarySoft },
  teamDropdownRowTextArea: { flex: 1 },
  teamDropdownRowText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  teamDropdownRowTextSelected: { color: theme.colors.text.brand },
  teamDropdownRowMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.regular,
    marginTop: theme.spacing.xs,
  },
  teamDropdownRowCount: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
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
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.text.secondary,
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
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
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
  eventList: { gap: theme.spacing.md },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
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
  eventMainArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  eventDeleteButton: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  eventDeleteButtonText: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
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
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  eventTimeText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  eventInfo: { flex: 1 },
  eventType: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
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
    fontWeight: theme.fontWeights.semibold,
  },
  memberInfo: { flex: 1 },
  memberName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  memberMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
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
    fontWeight: theme.fontWeights.semibold,
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
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
