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
import type { ScheduleEvent, TeamSyncAppData, UserProfile } from "@/types/teamSync";

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

function getStatusLabel(status: AvailabilityStatus) {
  if (status === "available") return "Uygun";
  if (status === "notAvailable") return "Uygun değil";
  return "Cevap yok";
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Tarih yok";
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

function getCurrentSaveLabel() {
  const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `Şimdi · ${time}`;
}

function getEventTeamName(event: ScheduleEvent, appData: TeamSyncAppData | null) {
  if (appData === null || event.teamId === undefined) return "Tüm Kulüp";
  return appData.teams.find((team) => team.id === event.teamId)?.name ?? "Takım bulunamadı";
}

function getVisibleUsersForEvent(event: ScheduleEvent | undefined, users: UserProfile[], appData: TeamSyncAppData | null) {
  const activeUsers = users.filter((user) => user.status !== "removed");

  if (event === undefined || event.teamId === undefined || appData === null) {
    return activeUsers;
  }

  return activeUsers.filter((user) => user.teamIds.includes(event.teamId ?? ""));
}

export default function AvailabilityScreen() {
  const { appData } = useAppDataContext();
  const [selectedEventIdState, setSelectedEventId] = useState("");
  const [statusByUserId, setStatusByUserId] = useState<Record<string, AvailabilityStatus>>({});
  const [noteByUserId, setNoteByUserId] = useState<Record<string, string>>({});
  const [myNoteState, setMyNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("Uygunluk bilgileri merkezi TeamSync datasından yüklendi.");
  const [lastSavedAt, setLastSavedAt] = useState("Henüz kaydedilmedi");

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

  function updateMyStatus(newStatus: AvailabilityStatus) {
    if (currentUserId.length === 0) {
      setStatusMessage("Önce kullanıcı datası yüklenmeli.");
      return;
    }

    setStatusByUserId((currentStatuses) => ({ ...currentStatuses, [currentUserId]: newStatus }));
    setNoteByUserId((currentNotes) => ({ ...currentNotes, [currentUserId]: myNote.trim() }));
    setLastSavedAt(getCurrentSaveLabel());
    setStatusMessage("Uygunluk durumun kaydedildi.");
  }

  function saveMyNote() {
    if (currentUserId.length === 0) {
      setStatusMessage("Önce kullanıcı datası yüklenmeli.");
      return;
    }

    setNoteByUserId((currentNotes) => ({ ...currentNotes, [currentUserId]: myNote.trim() }));
    setLastSavedAt(getCurrentSaveLabel());
    setStatusMessage("Not kaydedildi.");
  }

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Katılım planlama"
        title="Uygunluk"
        subtitle="Etkinlik için gelip gelemeyeceğini bildir."
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Kim geliyor, kim gelemiyor?</Text>
        <Text style={styles.heroSubtitle}>Maç ve antrenman öncesi takım planlamasını kolaylaştırır.</Text>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Etkinlik seç</Text>
            <Text style={styles.sectionSubtitle}>Takvimdeki etkinliklerden birini seç.</Text>
          </View>
          <Text style={styles.statusPill}>{events.length} etkinlik</Text>
        </View>

        {events.length > 0 ? (
          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = selectedEventId === event.id;

              return (
                <Pressable key={event.id} onPress={() => setSelectedEventId(event.id)} style={({ pressed }) => [styles.eventCard, isSelected ? styles.eventCardActive : null, pressed ? styles.pressed : null]}>
                  <Text style={[styles.eventTitle, isSelected ? styles.eventTitleActive : null]}>{event.title}</Text>
                  <Text style={[styles.eventMeta, isSelected ? styles.eventMetaActive : null]}>{getEventTeamName(event, appData)} · {formatEventTime(event.startsAt)} · {event.location}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState title="Henüz etkinlik yok" description="Uygunluk seçmek için önce Schedule sayfasından bir etkinlik ekle." />
        )}
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Benim durumum</Text>
            <Text style={styles.sectionSubtitle}>{selectedEvent ? `${selectedEvent.title} için uygunluk durumunu seç.` : statusMessage}</Text>
          </View>
          <StatusBadge label={getStatusLabel(myAvailabilityStatus)} tone={availabilityToneByStatus[myAvailabilityStatus]} />
        </View>

        <View style={styles.myStatusCard}>
          <Text style={styles.myName}>{appData?.currentUser.fullName || "Kullanıcı"}</Text>
          <Text style={styles.myTeam}>Son kayıt: {lastSavedAt}</Text>
        </View>

        <TextField
          label="Not"
          placeholder="Örn: Geliyorum / Geç kalabilirim / Gelemiyorum"
          value={myNote}
          onChangeText={setMyNote}
          multiline
          containerStyle={styles.noteField}
        />

        <View style={styles.actionRow}>
          <AppButton title="Uygunum" onPress={() => updateMyStatus("available")} style={styles.actionButton} />
          <AppButton title="Uygun değilim" variant="secondary" onPress={() => updateMyStatus("notAvailable")} style={styles.actionButton} />
          <AppButton title="Notu kaydet" variant="ghost" onPress={saveMyNote} style={styles.actionButton} />
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.availableCount}</Text><Text style={styles.statLabel}>Uygun</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAvailableCount}</Text><Text style={styles.statLabel}>Uygun değil</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAnsweredCount}</Text><Text style={styles.statLabel}>Cevap yok</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>%{availabilitySummary.responseRate}</Text><Text style={styles.statLabel}>Cevap oranı</Text></Card>
      </View>

      {userCanViewTeamList ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Takım uygunluk listesi</Text>
              <Text style={styles.sectionSubtitle}>Seçilen etkinlik için kullanıcıların durumunu gör.</Text>
            </View>
            <Text style={styles.statusPill}>{availabilitySummary.totalCount} kişi</Text>
          </View>

          {visibleUsers.length > 0 ? (
            <View style={styles.athleteList}>
              {visibleUsers.map((user) => {
                const status = statusByUserId[user.id] ?? "notAnswered";

                return (
                  <View key={user.id} style={styles.athleteCard}>
                    <View style={styles.athleteTopRow}>
                      <View style={styles.athleteInfo}>
                        <Text style={styles.athleteName}>{user.fullName}</Text>
                        <Text style={styles.parentName}>{user.email || "E-posta yok"}</Text>
                      </View>
                      <StatusBadge label={getStatusLabel(status)} tone={availabilityToneByStatus[status]} />
                    </View>
                    <Text style={styles.noteText}>{noteByUserId[user.id] !== undefined && noteByUserId[user.id] !== "" ? noteByUserId[user.id] : "Not yazılmadı."}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState title="Bu etkinlikte kullanıcı yok" description="Takım üyeleri eklendiğinde burada görünecek." />
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
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full, overflow: "hidden" },
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
  athleteList: { gap: theme.spacing.md },
  athleteCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  athleteTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  athleteInfo: { flex: 1 },
  athleteName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  parentName: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  noteText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
