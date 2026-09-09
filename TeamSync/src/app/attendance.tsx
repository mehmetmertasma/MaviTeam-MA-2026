import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { teamSyncService } from "@/services/teamSyncService";
import type { AttendanceStatus, ScheduleEvent, Team, TeamSyncAppData, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

type AttendanceOption = {
  value: AttendanceStatus;
  label: string;
};

const attendanceToneByStatus: Record<AttendanceStatus, StatusBadgeTone> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

const EMPTY_TEAMS: Team[] = [];
const EMPTY_USERS: UserProfile[] = [];
const EMPTY_EVENTS: ScheduleEvent[] = [];

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  const attendanceOptions: AttendanceOption[] = [
    { value: "present", label: en ? "Present" : "Katıldı" },
    { value: "absent", label: en ? "Absent" : "Katılmadı" },
    { value: "late", label: en ? "Late" : "Geç kaldı" },
    { value: "excused", label: en ? "Excused" : "Mazeretli" },
  ];

  const eventTypeLabels: Record<ScheduleEvent["type"], string> = {
    practice: en ? "Practice" : "Antrenman",
    match: en ? "Match" : "Maç",
    meeting: en ? "Meeting" : "Toplantı",
  };

  return {
    attendanceOptions,
    eventTypeLabels,
    noDate: en ? "No date" : "Tarih yok",
    noTime: en ? "No time" : "Saat yok",
    notSavedYet: en ? "Not saved yet" : "Henüz kaydedilmedi",
    initialStatus: en
      ? "Choose a team and a session to take attendance."
      : "Önce takım ve antrenman seçerek yoklama alabilirsin.",
    teamSelected: (teamName: string) =>
      en
        ? `${teamName} selected. Now choose a practice or match session.`
        : `${teamName} seçildi. Şimdi antrenman veya maç oturumu seç.`,
    attendanceOpened: (eventTitle: string) =>
      en ? `Attendance opened for ${eventTitle}.` : `${eventTitle} için yoklama açıldı.`,
    confirmRemoveEvent: (eventTitle: string) =>
      en
        ? `${eventTitle} will be deleted. Tap Delete again to confirm.`
        : `${eventTitle} silinecek. Eminsen tekrar Sil'e bas.`,
    eventRemoved: (eventTitle: string) => (en ? `${eventTitle} deleted.` : `${eventTitle} silindi.`),
    removeEventError: en ? "There was a problem deleting the session." : "Oturum silinirken bir sorun oluştu.",
    createSessionNeedsTeam: en
      ? "Choose a team above before creating a session."
      : "Oturum oluşturmak için önce yukarıdan bir takım seçmelisin.",
    createSessionNeedsTitle: en
      ? "Enter a title for the session, e.g. U17 Practice."
      : "Oturum için bir başlık yazmalısın. Örn. U17 Antrenmanı.",
    locationUnspecified: en ? "Not specified" : "Belirtilmedi",
    createSessionSuccess: (teamName: string, sessionTitle: string) =>
      en
        ? `${sessionTitle} session created for ${teamName}. You can take attendance now.`
        : `${teamName} için ${sessionTitle} oturumu oluşturuldu. Şimdi yoklama alabilirsin.`,
    createSessionError: en ? "There was a problem creating the session." : "Oturum oluşturulurken bir sorun oluştu.",
    statusUpdated: en ? "Attendance updated. Don't forget to save." : "Yoklama güncellendi. Kaydetmeyi unutma.",
    saveNeedsSelection: en
      ? "Choose a team and a session before saving attendance."
      : "Yoklama kaydetmek için önce takım ve antrenman seçmelisin.",
    saveNoMembers: en
      ? "There are no active members on this team to take attendance for."
      : "Bu takımda yoklama alınacak aktif kişi yok.",
    saveSuccess: en ? "Attendance saved for the selected session." : "Yoklama seçilen antrenman için kaydedildi.",
    saveError: en ? "There was a problem saving attendance." : "Yoklama kaydedilirken bir sorun oluştu.",
    resetSuccess: en ? "Changes for this session were reset." : "Bu oturumdaki değişiklikler sıfırlandı.",
    eyebrow: en ? "Attendance flow" : "Yoklama akışı",
    pageTitle: en ? "Attendance" : "Yoklama",
    subtitleAdmin: en
      ? "First choose a team, then pick which practice or match you're taking attendance for."
      : "Önce takım seç, sonra hangi antrenman veya maç için yoklama aldığını seç.",
    subtitleViewer: en
      ? "Choose your team and the practice or match to see attendance status."
      : "Takımını ve antrenman/maçı seç, katılım durumunu buradan görebilirsin.",
    heroTitle: en ? "Attendance by team and session" : "Takım + oturum bazlı yoklama",
    heroSubtitle: en
      ? "Attendance is no longer a single athlete list — it's recorded against a specific practice or match on the selected team's schedule."
      : "Yoklama artık tek bir sporcu listesi değil; seçilen takım ve programdaki belirli antrenman/maç üzerinden kaydedilir.",
    step1Title: en ? "1. Choose a team" : "1. Takım seç",
    step1SubtitleAdmin: en ? "Which team is this attendance for?" : "Yoklama hangi takım için alınacak?",
    step1SubtitleViewer: en
      ? "Choose the team whose attendance you want to see."
      : "Yoklamasını görmek istediğin takımı seç.",
    teamsCount: (count: number) => (en ? `${count} teams` : `${count} takım`),
    noTeamsTitleAdmin: en ? "No teams yet" : "Henüz takım yok",
    noTeamsDescAdmin: en
      ? "Create a team from the Teams screen first."
      : "Önce Takımlar ekranından takım oluşturmalısın.",
    noTeamsTitleViewer: en ? "You're not part of a team yet" : "Henüz bir takıma bağlı değilsin",
    noTeamsDescViewer: en
      ? "Once you're added to a team, you'll be able to see attendance here."
      : "Bir takıma eklendiğinde yoklama durumunu burada görebileceksin.",
    teamLabel: en ? "Team" : "Takım",
    chooseTeam: en ? "Choose a team" : "Takım seç",
    memberCount: (count: number) => (en ? `${count} people` : `${count} kişi`),
    step2Title: en ? "2. Choose a practice or match" : "2. Antrenman / maç seç",
    step2Subtitle: en
      ? "Which day and session is this attendance for?"
      : "Yoklama hangi gün ve hangi program için alınacak?",
    sessionsCount: (count: number) => (en ? `${count} sessions` : `${count} oturum`),
    close: en ? "Close" : "Kapat",
    newSession: en ? "Create new session" : "Yeni oturum oluştur",
    newSessionFor: (teamName: string) => (en ? `New session for ${teamName}` : `${teamName} için yeni oturum`),
    newSessionHint: en
      ? "The session is created for right now (today's date and time). Use the Schedule screen to plan a different date."
      : "Oturum şimdi (bugünün tarihi ve saati) için oluşturulur. Farklı bir tarih planlamak istersen Program ekranını kullan.",
    sessionNameLabel: en ? "Session name" : "Oturum adı",
    sessionNamePlaceholder: en ? "e.g. U17 Practice" : "Örn. U17 Antrenmanı",
    sessionLocationLabel: en ? "Location (optional)" : "Konum (opsiyonel)",
    sessionLocationPlaceholder: en ? "e.g. Club Gym" : "Örn. Kulüp Salonu",
    creatingSession: en ? "Creating..." : "Oluşturuluyor...",
    createSession: en ? "Create session" : "Oturumu oluştur",
    noTeamSelectedTitle: en ? "No team selected" : "Takım seçilmedi",
    noTeamSelectedDesc: en ? "Choose a team above first." : "Önce yukarıdan bir takım seçmelisin.",
    noScheduleTitle: en ? "No schedule for this team" : "Bu takım için program yok",
    noScheduleDescAdmin: en
      ? 'Use the "Create new session" button above to open a practice or match session right away.'
      : "Yukarıdaki 'Yeni oturum oluştur' butonuyla hemen bir antrenman/maç oturumu açabilirsin.",
    noScheduleDescViewer: en
      ? "Once a practice or match is added to this team from the Schedule screen, it will appear here."
      : "Program ekranından bu takıma antrenman veya maç eklenince burada görünecek.",
    confirmDelete: en ? "Sure?" : "Emin misin?",
    delete: en ? "Delete" : "Sil",
    step3TitleAdmin: en ? "3. Take attendance" : "3. Yoklama al",
    step3TitleViewer: en ? "3. Attendance status" : "3. Yoklama durumu",
    noTeamSelectedShort: en ? "No team selected" : "Takım seçilmedi",
    noSessionSelectedShort: en ? "No session selected" : "Oturum seçilmedi",
    lastSavedLabel: en ? "Last saved" : "Son kayıt",
    attendanceRate: (rate: number) => (en ? `${rate}% attendance` : `%${rate} katılım`),
    notReadyTitle: en ? "Attendance isn't ready yet" : "Yoklama hazır değil",
    notReadyDesc: en
      ? "Choose a team and a practice/match first to see the athlete list."
      : "Sporcu listesi için önce takım ve antrenman/maç seç.",
    noActiveMembersTitle: en ? "No active members on this team" : "Bu takımda aktif kişi yok",
    noActiveMembersDesc: en
      ? "Once members are added to the team, the attendance list will appear here."
      : "Takıma üye eklenince yoklama listesi burada görünecek.",
    searchPlaceholder: en ? "Search by name or email..." : "İsim veya e-posta ara...",
    searchAccessibilityLabel: en ? "Search attendance list" : "Yoklama listesinde ara",
    noSearchMatchTitle: en ? "No matches found" : "Aramayla eşleşen kişi yok",
    noSearchMatchDesc: en ? "Try a different name or email." : "Farklı bir isim veya e-posta ile tekrar dene.",
    notSaved: en ? "Not saved" : "Kaydedilmedi",
    saveAttendance: en ? "Save attendance" : "Yoklamayı kaydet",
    resetChanges: en ? "Reset changes" : "Değişiklikleri sıfırla",
  };
}

function formatEventDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "tr-TR" ? "Tarih yok" : "No date";
  }

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
}

function formatEventTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "tr-TR" ? "Saat yok" : "No time";
  }

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";

  const { appData, setAppData } = useAppDataContext();
  const [selectedTeamIdState, setSelectedTeamId] = useState("");
  const [selectedEventIdState, setSelectedEventId] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceStatus>>({});
  const [lastSavedAt, setLastSavedAt] = useState(copy.notSavedYet);
  const [statusMessage, setStatusMessage] = useState(copy.initialStatus);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionLocation, setNewSessionLocation] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [pendingRemoveEventId, setPendingRemoveEventId] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

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

  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((member) => matchesSearchQuery(memberSearchQuery, member.fullName, member.email));
  }, [teamMembers, memberSearchQuery]);

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
    setMemberSearchQuery("");
    setStatusMessage(copy.teamSelected(team.name));
  }

  function selectEvent(event: ScheduleEvent) {
    setSelectedEventId(event.id);
    setAttendanceDraft({});
    setStatusMessage(copy.attendanceOpened(event.title));
  }

  async function handleRemoveEvent(event: ScheduleEvent) {
    if (pendingRemoveEventId !== event.id) {
      setPendingRemoveEventId(event.id);
      setStatusMessage(copy.confirmRemoveEvent(event.title));
      return;
    }

    try {
      const nextAppData = await teamSyncService.removeScheduleEvent(event.id);
      setAppData(nextAppData);
      setPendingRemoveEventId("");

      if (selectedEventId === event.id) {
        setSelectedEventId("");
      }

      setStatusMessage(copy.eventRemoved(event.title));
    } catch {
      setStatusMessage(copy.removeEventError);
    }
  }

  async function handleCreateSession() {
    if (appData === null || selectedTeam === undefined) {
      setStatusMessage(copy.createSessionNeedsTeam);
      return;
    }

    const trimmedTitle = newSessionTitle.trim();

    if (trimmedTitle.length === 0) {
      setStatusMessage(copy.createSessionNeedsTitle);
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
        location: newSessionLocation.trim() || copy.locationUnspecified,
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
      setStatusMessage(copy.createSessionSuccess(selectedTeam.name, trimmedTitle));
    } catch {
      setStatusMessage(copy.createSessionError);
    } finally {
      setIsCreatingSession(false);
    }
  }

  function updateAttendanceStatus(userId: string, newStatus: AttendanceStatus) {
    setAttendanceDraft((currentDraft) => ({
      ...currentDraft,
      [userId]: newStatus,
    }));

    setStatusMessage(copy.statusUpdated);
  }

  async function handleSaveAttendance() {
    if (appData === null || selectedTeam === undefined || selectedEvent === undefined) {
      setStatusMessage(copy.saveNeedsSelection);
      return;
    }

    if (teamMembers.length === 0) {
      setStatusMessage(copy.saveNoMembers);
      return;
    }

    try {
      setIsSavingAttendance(true);

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

      const savedTime = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      setAppData(nextAppData);
      setAttendanceDraft({});
      setLastSavedAt(`${selectedEvent.title} · ${savedTime}`);
      setStatusMessage(copy.saveSuccess);
    } catch {
      setStatusMessage(copy.saveError);
    } finally {
      setIsSavingAttendance(false);
    }
  }

  function resetCurrentAttendance() {
    setAttendanceDraft({});
    setLastSavedAt(copy.notSavedYet);
    setStatusMessage(copy.resetSuccess);
  }

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.pageTitle}
        subtitle={canTakeAttendance ? copy.subtitleAdmin : copy.subtitleViewer}
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.present}</Text>
          <Text style={styles.statLabel}>{copy.attendanceOptions[0].label}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.absent}</Text>
          <Text style={styles.statLabel}>{copy.attendanceOptions[1].label}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.late}</Text>
          <Text style={styles.statLabel}>{copy.attendanceOptions[2].label}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceSummary.excused}</Text>
          <Text style={styles.statLabel}>{copy.attendanceOptions[3].label}</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.step1Title}</Text>
            <Text style={styles.sectionSubtitle}>
              {canTakeAttendance ? copy.step1SubtitleAdmin : copy.step1SubtitleViewer}
            </Text>
          </View>
          <Text style={styles.statusPill}>{copy.teamsCount(teams.length)}</Text>
        </View>

        {teams.length === 0 ? (
          canTakeAttendance ? (
            <EmptyState title={copy.noTeamsTitleAdmin} description={copy.noTeamsDescAdmin} />
          ) : (
            <EmptyState title={copy.noTeamsTitleViewer} description={copy.noTeamsDescViewer} />
          )
        ) : (
          <View>
            <Pressable
              onPress={() => setShowTeamPicker((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.teamDropdownButton, pressed ? styles.pressed : null]}
            >
              <View style={styles.teamDropdownTextArea}>
                <Text style={styles.teamDropdownLabel}>{copy.teamLabel}</Text>
                <Text style={styles.teamDropdownValue}>{selectedTeam?.name ?? copy.chooseTeam}</Text>
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
                        {copy.memberCount(teamMemberCount)}
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
            <Text style={styles.sectionTitle}>{copy.step2Title}</Text>
            <Text style={styles.sectionSubtitle}>
              {copy.step2Subtitle}
            </Text>
          </View>
          <Text style={styles.statusPill}>{copy.sessionsCount(availableEvents.length)}</Text>
        </View>

        {canTakeAttendance && selectedTeam !== undefined ? (
          <AppButton
            title={showCreateSession ? copy.close : copy.newSession}
            variant="secondary"
            onPress={() => setShowCreateSession((currentValue) => !currentValue)}
            style={styles.newSessionButton}
          />
        ) : null}

        {showCreateSession && selectedTeam !== undefined ? (
          <Card variant="subtle" style={styles.createSessionBox}>
            <Text style={styles.createSessionTitle}>{copy.newSessionFor(selectedTeam.name)}</Text>
            <Text style={styles.createSessionSubtitle}>
              {copy.newSessionHint}
            </Text>

            <TextField
              label={copy.sessionNameLabel}
              value={newSessionTitle}
              onChangeText={setNewSessionTitle}
              placeholder={copy.sessionNamePlaceholder}
              containerStyle={styles.createSessionField}
            />

            <TextField
              label={copy.sessionLocationLabel}
              value={newSessionLocation}
              onChangeText={setNewSessionLocation}
              placeholder={copy.sessionLocationPlaceholder}
              containerStyle={styles.createSessionField}
            />

            <AppButton
              title={isCreatingSession ? copy.creatingSession : copy.createSession}
              onPress={handleCreateSession}
              disabled={isCreatingSession}
              style={styles.createSessionButton}
            />
          </Card>
        ) : null}

        {selectedTeam === undefined ? (
          <EmptyState title={copy.noTeamSelectedTitle} description={copy.noTeamSelectedDesc} />
        ) : availableEvents.length === 0 ? (
          <EmptyState
            title={copy.noScheduleTitle}
            description={canTakeAttendance ? copy.noScheduleDescAdmin : copy.noScheduleDescViewer}
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
                      <Text style={styles.eventDateText}>{formatEventDate(event.startsAt, locale)}</Text>
                      <Text style={styles.eventTimeText}>{formatEventTime(event.startsAt, locale)}</Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventType}>{copy.eventTypeLabels[event.type]}</Text>
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
                        {pendingRemoveEventId === event.id ? copy.confirmDelete : copy.delete}
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
            <Text style={styles.sectionTitle}>{canTakeAttendance ? copy.step3TitleAdmin : copy.step3TitleViewer}</Text>
            <Text style={styles.sectionSubtitle}>
              {canTakeAttendance
                ? `${selectedTeam?.name ?? copy.noTeamSelectedShort} · ${selectedEvent?.title ?? copy.noSessionSelectedShort} · ${copy.lastSavedLabel}: ${lastSavedAt}`
                : `${selectedTeam?.name ?? copy.noTeamSelectedShort} · ${selectedEvent?.title ?? copy.noSessionSelectedShort}`}
            </Text>
          </View>
          <Text style={styles.statusPill}>{copy.attendanceRate(attendanceSummary.attendanceRate)}</Text>
        </View>

        {selectedTeam === undefined || selectedEvent === undefined ? (
          <EmptyState title={copy.notReadyTitle} description={copy.notReadyDesc} />
        ) : teamMembers.length === 0 ? (
          <EmptyState title={copy.noActiveMembersTitle} description={copy.noActiveMembersDesc} />
        ) : (
          <>
            {teamMembers.length > 5 ? (
              <SearchField
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholder={copy.searchPlaceholder}
                accessibilityLabel={copy.searchAccessibilityLabel}
                style={styles.memberSearchField}
              />
            ) : null}

            {filteredTeamMembers.length === 0 ? (
              <EmptyState title={copy.noSearchMatchTitle} description={copy.noSearchMatchDesc} />
            ) : (
              <View style={styles.attendanceList}>
                {filteredTeamMembers.map((member) => {
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
                          label={displayStatus === undefined ? copy.notSaved : copy.attendanceOptions.find((option) => option.value === displayStatus)?.label ?? ""}
                          tone={displayStatus === undefined ? "neutral" : attendanceToneByStatus[displayStatus]}
                        />
                      </View>

                      {canTakeAttendance ? (
                        <View style={styles.statusGrid}>
                          {copy.attendanceOptions.map((option) => {
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
          </>
        )}

        {canTakeAttendance ? (
          <View style={styles.actionRow}>
            <AppButton
              title={copy.saveAttendance}
              onPress={handleSaveAttendance}
              loading={isSavingAttendance}
              disabled={isSavingAttendance}
              style={styles.actionButton}
            />
            <AppButton
              title={copy.resetChanges}
              variant="ghost"
              onPress={resetCurrentAttendance}
              disabled={isSavingAttendance}
              style={styles.actionButton}
            />
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
    borderRadius: theme.radius.sm,
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
    borderRadius: theme.radius.md,
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
  memberSearchField: { marginBottom: theme.spacing.md },
  attendanceList: { gap: theme.spacing.sm },
  memberCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
