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
import type { ScheduleEvent, TeamSyncAppData, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

type AvailabilityStatus = "available" | "notAvailable" | "notAnswered";

const EMPTY_EVENTS: ScheduleEvent[] = [];
const EMPTY_USERS: UserProfile[] = [];

const availabilityToneByStatus: Record<AvailabilityStatus, StatusBadgeTone> = {
  available: "success",
  notAvailable: "danger",
  notAnswered: "neutral",
};

function canViewTeamList(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "superAdmin" || appData?.currentUser.role === "clubAdmin" || appData?.currentUser.role === "coach";
}

function formatEventTime(value: string, locale: string, noDateLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || noDateLabel;
  return date.toLocaleString(locale, { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

function getCurrentSaveLabel(locale: string, nowLabel: string) {
  const time = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${nowLabel} · ${time}`;
}

function getEventTeamName(event: ScheduleEvent, appData: TeamSyncAppData | null, allClubLabel: string, teamNotFoundLabel: string) {
  if (appData === null || event.teamId === undefined) return allClubLabel;
  return appData.teams.find((team) => team.id === event.teamId)?.name ?? teamNotFoundLabel;
}

function getVisibleUsersForEvent(event: ScheduleEvent | undefined, users: UserProfile[], appData: TeamSyncAppData | null) {
  const activeUsers = users.filter((user) => user.status !== "removed");

  if (event === undefined || event.teamId === undefined || appData === null) {
    return activeUsers;
  }

  return activeUsers.filter((user) => user.teamIds.includes(event.teamId ?? ""));
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  const statusLabels: Record<AvailabilityStatus, string> = {
    available: en ? "Available" : "Uygun",
    notAvailable: en ? "Not available" : "Uygun değil",
    notAnswered: en ? "No response" : "Cevap yok",
  };

  return {
    statusLabels,
    noDate: en ? "No date" : "Tarih yok",
    now: en ? "Now" : "Şimdi",
    allClub: en ? "Whole Club" : "Tüm Kulüp",
    teamNotFound: en ? "Team not found" : "Takım bulunamadı",
    availabilityUpdated: en ? "Availability updated." : "Uygunluk bilgileri güncellendi.",
    notSavedYet: en ? "Not saved yet" : "Henüz kaydedilmedi",
    waitForUserLoad: en ? "Please wait for your account to finish loading." : "Hesap bilgilerinin yüklenmesini bekle.",
    myStatusSaved: en ? "Your availability status was saved." : "Uygunluk durumun kaydedildi.",
    noteSaved: en ? "Note saved." : "Not kaydedildi.",
    eyebrow: en ? "Participation planning" : "Katılım planlama",
    pageTitle: en ? "Availability" : "Uygunluk",
    pageSubtitle: en ? "Let the team know if you can make it to an event." : "Etkinlik için gelip gelemeyeceğini bildir.",
    heroTitle: en ? "Who's in, who's out?" : "Kim geliyor, kim gelemiyor?",
    heroSubtitle: en
      ? "Makes team planning easier ahead of matches and practices."
      : "Maç ve antrenman öncesi takım planlamasını kolaylaştırır.",
    selectEventTitle: en ? "Select an event" : "Etkinlik seç",
    selectEventSubtitle: en ? "Pick one of the events on the calendar." : "Takvimdeki etkinliklerden birini seç.",
    eventsCount: (count: number) => (en ? `${count} events` : `${count} etkinlik`),
    noEventsTitle: en ? "No events yet" : "Henüz etkinlik yok",
    noEventsDescription: en
      ? "Add an event on the Schedule page first before setting your availability."
      : "Uygunluk seçmek için önce Program sayfasından bir etkinlik ekle.",
    myStatusTitle: en ? "My status" : "Benim durumum",
    myStatusSubtitleForEvent: (eventTitle: string) => (en ? `Set your availability status for ${eventTitle}.` : `${eventTitle} için uygunluk durumunu seç.`),
    userFallback: en ? "User" : "Kullanıcı",
    lastSaved: (value: string) => (en ? `Last saved: ${value}` : `Son kayıt: ${value}`),
    noteLabel: en ? "Note" : "Not",
    notePlaceholder: en ? "E.g. I'm coming / I might be late / I can't make it" : "Örn: Geliyorum / Geç kalabilirim / Gelemiyorum",
    imAvailable: en ? "I'm available" : "Uygunum",
    imNotAvailable: en ? "I'm not available" : "Uygun değilim",
    saveNote: en ? "Save note" : "Notu kaydet",
    available: en ? "Available" : "Uygun",
    notAvailable: en ? "Not available" : "Uygun değil",
    noResponse: en ? "No response" : "Cevap yok",
    responseRate: en ? "Response rate" : "Cevap oranı",
    teamListTitle: en ? "Team availability list" : "Takım uygunluk listesi",
    teamListSubtitle: en ? "See each user's status for the selected event." : "Seçilen etkinlik için kullanıcıların durumunu gör.",
    peopleCount: (count: number) => (en ? `${count} people` : `${count} kişi`),
    searchNameOrEmail: en ? "Search by name or email..." : "İsim veya e-posta ara...",
    searchRosterLabel: en ? "Search availability list" : "Uygunluk listesinde ara",
    noUsersInEventTitle: en ? "No users in this event" : "Bu etkinlikte kullanıcı yok",
    noUsersInEventDescription: en ? "They'll appear here once team members are added." : "Takım üyeleri eklendiğinde burada görünecek.",
    noMatchingPeopleTitle: en ? "No matching people" : "Aramayla eşleşen kişi yok",
    noMatchingPeopleDescription: en ? "Try again with a different name or email." : "Farklı bir isim veya e-posta ile tekrar dene.",
    noEmail: en ? "No email" : "E-posta yok",
    noNoteWritten: en ? "No note written." : "Not yazılmadı.",
  };
}

export default function AvailabilityScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData } = useAppDataContext();
  const [selectedEventIdState, setSelectedEventId] = useState("");
  const [statusByUserId, setStatusByUserId] = useState<Record<string, AvailabilityStatus>>({});
  const [noteByUserId, setNoteByUserId] = useState<Record<string, string>>({});
  const [myNoteState, setMyNote] = useState("");
  const [statusMessage, setStatusMessage] = useState(copy.availabilityUpdated);
  const [lastSavedAt, setLastSavedAt] = useState(copy.notSavedYet);
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");

  const events = appData?.scheduleEvents ?? EMPTY_EVENTS;
  const users = appData?.users ?? EMPTY_USERS;
  const selectedEventId = selectedEventIdState || events[0]?.id || "";
  const myNote = myNoteState || (appData !== null ? noteByUserId[appData.currentUser.id] ?? "" : "");
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];
  const visibleUsers = getVisibleUsersForEvent(selectedEvent, users, appData);
  const userCanViewTeamList = canViewTeamList(appData);
  const currentUserId = appData?.currentUser.id ?? "";
  const myAvailabilityStatus = statusByUserId[currentUserId] ?? "notAnswered";

  const availabilitySummary = useMemo(() => {
    const availableCount = visibleUsers.filter((user) => (statusByUserId[user.id] ?? "notAnswered") === "available").length;
    const notAvailableCount = visibleUsers.filter((user) => (statusByUserId[user.id] ?? "notAnswered") === "notAvailable").length;
    const notAnsweredCount = visibleUsers.filter((user) => (statusByUserId[user.id] ?? "notAnswered") === "notAnswered").length;
    const totalCount = visibleUsers.length;
    const responseRate = totalCount > 0 ? Math.round(((availableCount + notAvailableCount) / totalCount) * 100) : 0;

    return { availableCount, notAvailableCount, notAnsweredCount, totalCount, responseRate };
  }, [statusByUserId, visibleUsers]);

  const filteredVisibleUsers = useMemo(() => {
    return visibleUsers.filter((user) => matchesSearchQuery(rosterSearchQuery, user.fullName, user.email));
  }, [visibleUsers, rosterSearchQuery]);

  function updateMyStatus(newStatus: AvailabilityStatus) {
    if (currentUserId.length === 0) {
      setStatusMessage(copy.waitForUserLoad);
      return;
    }

    setStatusByUserId((currentStatuses) => ({ ...currentStatuses, [currentUserId]: newStatus }));
    setNoteByUserId((currentNotes) => ({ ...currentNotes, [currentUserId]: myNote.trim() }));
    setLastSavedAt(getCurrentSaveLabel(locale, copy.now));
    setStatusMessage(copy.myStatusSaved);
  }

  function saveMyNote() {
    if (currentUserId.length === 0) {
      setStatusMessage(copy.waitForUserLoad);
      return;
    }

    setNoteByUserId((currentNotes) => ({ ...currentNotes, [currentUserId]: myNote.trim() }));
    setLastSavedAt(getCurrentSaveLabel(locale, copy.now));
    setStatusMessage(copy.noteSaved);
  }

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.selectEventTitle}</Text>
            <Text style={styles.sectionSubtitle}>{copy.selectEventSubtitle}</Text>
          </View>
          <Text style={styles.statusPill}>{copy.eventsCount(events.length)}</Text>
        </View>

        {events.length > 0 ? (
          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = selectedEventId === event.id;

              return (
                <Pressable key={event.id} onPress={() => setSelectedEventId(event.id)} style={({ pressed }) => [styles.eventCard, isSelected ? styles.eventCardActive : null, pressed ? styles.pressed : null]}>
                  <Text style={[styles.eventTitle, isSelected ? styles.eventTitleActive : null]}>{event.title}</Text>
                  <Text style={[styles.eventMeta, isSelected ? styles.eventMetaActive : null]}>{getEventTeamName(event, appData, copy.allClub, copy.teamNotFound)} · {formatEventTime(event.startsAt, locale, copy.noDate)} · {event.location}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState title={copy.noEventsTitle} description={copy.noEventsDescription} />
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.myStatusTitle}</Text>
            <Text style={styles.sectionSubtitle}>{selectedEvent ? copy.myStatusSubtitleForEvent(selectedEvent.title) : statusMessage}</Text>
          </View>
          <StatusBadge label={copy.statusLabels[myAvailabilityStatus]} tone={availabilityToneByStatus[myAvailabilityStatus]} />
        </View>

        <View style={styles.myStatusCard}>
          <Text style={styles.myName}>{appData?.currentUser.fullName || copy.userFallback}</Text>
          <Text style={styles.myTeam}>{copy.lastSaved(lastSavedAt)}</Text>
        </View>

        <TextField
          label={copy.noteLabel}
          placeholder={copy.notePlaceholder}
          value={myNote}
          onChangeText={setMyNote}
          multiline
          containerStyle={styles.noteField}
        />

        <View style={styles.actionRow}>
          <AppButton title={copy.imAvailable} onPress={() => updateMyStatus("available")} style={styles.actionButton} />
          <AppButton title={copy.imNotAvailable} variant="secondary" onPress={() => updateMyStatus("notAvailable")} style={styles.actionButton} />
          <AppButton title={copy.saveNote} variant="ghost" onPress={saveMyNote} style={styles.actionButton} />
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.availableCount}</Text><Text style={styles.statLabel}>{copy.available}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAvailableCount}</Text><Text style={styles.statLabel}>{copy.notAvailable}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAnsweredCount}</Text><Text style={styles.statLabel}>{copy.noResponse}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>%{availabilitySummary.responseRate}</Text><Text style={styles.statLabel}>{copy.responseRate}</Text></Card>
      </View>

      {userCanViewTeamList ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{copy.teamListTitle}</Text>
              <Text style={styles.sectionSubtitle}>{copy.teamListSubtitle}</Text>
            </View>
            <Text style={styles.statusPill}>{copy.peopleCount(availabilitySummary.totalCount)}</Text>
          </View>

          {visibleUsers.length > 5 ? (
            <SearchField
              value={rosterSearchQuery}
              onChangeText={setRosterSearchQuery}
              placeholder={copy.searchNameOrEmail}
              accessibilityLabel={copy.searchRosterLabel}
              style={styles.searchField}
            />
          ) : null}

          {visibleUsers.length === 0 ? (
            <EmptyState title={copy.noUsersInEventTitle} description={copy.noUsersInEventDescription} />
          ) : filteredVisibleUsers.length === 0 ? (
            <EmptyState title={copy.noMatchingPeopleTitle} description={copy.noMatchingPeopleDescription} />
          ) : (
            <View style={styles.athleteList}>
              {filteredVisibleUsers.map((user) => {
                const status = statusByUserId[user.id] ?? "notAnswered";

                return (
                  <View key={user.id} style={styles.athleteCard}>
                    <View style={styles.athleteTopRow}>
                      <View style={styles.athleteInfo}>
                        <Text style={styles.athleteName}>{user.fullName}</Text>
                        <Text style={styles.parentName}>{user.email || copy.noEmail}</Text>
                      </View>
                      <StatusBadge label={copy.statusLabels[status]} tone={availabilityToneByStatus[status]} />
                    </View>
                    <Text style={styles.noteText}>{noteByUserId[user.id] !== undefined && noteByUserId[user.id] !== "" ? noteByUserId[user.id] : copy.noNoteWritten}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      ) : null}
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.semibold, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"] },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  sectionSubtitle: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.sm, overflow: "hidden" },
  eventList: { gap: theme.spacing.md },
  eventCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  eventCardActive: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  eventTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  eventTitleActive: { color: theme.colors.text.inverse },
  eventMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  eventMetaActive: { color: theme.colors.text.inverse, opacity: 0.86 },
  myStatusCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default, marginBottom: theme.spacing.lg },
  myName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  myTeam: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },
  noteField: { marginBottom: theme.spacing.lg },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  actionButton: { flexGrow: 1, minWidth: 160 },
  statusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.lg },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 135 },
  statValue: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, color: theme.colors.brand.primary, marginBottom: theme.spacing.xs },
  statLabel: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.medium, color: theme.colors.text.secondary },
  searchField: { marginBottom: theme.spacing.md },
  athleteList: { gap: theme.spacing.sm },
  athleteCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border.default },
  athleteTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  athleteInfo: { flex: 1 },
  athleteName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  parentName: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  noteText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
