import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import type { ScheduleEvent, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type AvailabilityStatus = "available" | "notAvailable" | "notAnswered";

const EMPTY_EVENTS: ScheduleEvent[] = [];
const EMPTY_USERS: UserProfile[] = [];

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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Uygunluk</Text>
          <Text style={styles.pageSubtitle}>Etkinlik için gelip gelemeyeceğini bildir.</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Katılım planlama</Text>
          <Text style={styles.heroTitle}>Kim geliyor, kim gelemiyor?</Text>
          <Text style={styles.heroSubtitle}>Maç ve antrenman öncesi takım planlamasını kolaylaştırır.</Text>
        </View>

        <View style={styles.section}>
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
            <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Henüz etkinlik yok</Text><Text style={styles.emptyText}>Uygunluk seçmek için önce Schedule sayfasından bir etkinlik ekle.</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Benim durumum</Text>
              <Text style={styles.sectionSubtitle}>{selectedEvent ? `${selectedEvent.title} için uygunluk durumunu seç.` : statusMessage}</Text>
            </View>
            <Text style={styles.statusPill}>{getStatusLabel(myAvailabilityStatus)}</Text>
          </View>

          <View style={styles.myStatusCard}>
            <Text style={styles.myName}>{appData?.currentUser.fullName || "Kullanıcı"}</Text>
            <Text style={styles.myTeam}>Son kayıt: {lastSavedAt}</Text>
          </View>

          <Text style={styles.label}>Not</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Örn: Geliyorum / Geç kalabilirim / Gelemiyorum" placeholderTextColor={theme.colors.text.muted} value={myNote} onChangeText={setMyNote} multiline />

          <View style={styles.actionRow}>
            <AppButton title="Uygunum" onPress={() => updateMyStatus("available")} style={styles.actionButton} />
            <AppButton title="Uygun değilim" variant="secondary" onPress={() => updateMyStatus("notAvailable")} style={styles.actionButton} />
            <AppButton title="Notu kaydet" variant="ghost" onPress={saveMyNote} style={styles.actionButton} />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.availableCount}</Text><Text style={styles.statLabel}>Uygun</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAvailableCount}</Text><Text style={styles.statLabel}>Uygun değil</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{availabilitySummary.notAnsweredCount}</Text><Text style={styles.statLabel}>Cevap yok</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>%{availabilitySummary.responseRate}</Text><Text style={styles.statLabel}>Cevap oranı</Text></View>
        </View>

        {userCanViewTeamList ? (
          <View style={styles.section}>
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
                  const isAvailable = status === "available";
                  const isNotAvailable = status === "notAvailable";

                  return (
                    <View key={user.id} style={styles.athleteCard}>
                      <View style={styles.athleteTopRow}>
                        <View style={styles.athleteInfo}>
                          <Text style={styles.athleteName}>{user.fullName}</Text>
                          <Text style={styles.parentName}>{user.email || "E-posta yok"}</Text>
                        </View>
                        <View style={[styles.listStatusBadge, isAvailable ? styles.listStatusBadgeAvailable : null, isNotAvailable ? styles.listStatusBadgeNotAvailable : null]}>
                          <Text style={[styles.listStatusText, isAvailable ? styles.listStatusTextAvailable : null, isNotAvailable ? styles.listStatusTextNotAvailable : null]}>{getStatusLabel(status)}</Text>
                        </View>
                      </View>
                      <Text style={styles.noteText}>{noteByUserId[user.id] !== undefined && noteByUserId[user.id] !== "" ? noteByUserId[user.id] : "Not yazılmadı."}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Bu etkinlikte kullanıcı yok</Text><Text style={styles.emptyText}>Takım üyeleri eklendiğinde burada görünecek.</Text></View>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: { flexGrow: 1, backgroundColor: theme.colors.background.app, paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing["2xl"] },
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.md },
  pageTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["5xl"], fontWeight: theme.fontWeights.black, lineHeight: theme.lineHeights["5xl"], marginBottom: theme.spacing.sm },
  pageSubtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  heroCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["3xl"], marginBottom: theme.spacing["2xl"], ...theme.shadows.md },
  heroLabel: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.full, marginBottom: theme.spacing.lg },
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.md },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  sectionSubtitle: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  eventList: { gap: theme.spacing.md },
  eventCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  eventCardActive: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  eventTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  eventTitleActive: { color: theme.colors.text.inverse },
  eventMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  eventMetaActive: { color: theme.colors.text.inverse, opacity: 0.86 },
  myStatusCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default, marginBottom: theme.spacing.lg },
  myName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  myTeam: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  input: { minHeight: 52, backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.lg },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  actionButton: { flexGrow: 1, minWidth: 160 },
  statusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.lg },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 135, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  statValue: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.brand.primary, marginBottom: theme.spacing.xs },
  statLabel: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold, color: theme.colors.text.secondary },
  athleteList: { gap: theme.spacing.md },
  athleteCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  athleteTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  athleteInfo: { flex: 1 },
  athleteName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  parentName: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  listStatusBadge: { backgroundColor: "#f3f4f6", borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, alignSelf: "flex-start" },
  listStatusBadgeAvailable: { backgroundColor: "#dcfce7" },
  listStatusBadgeNotAvailable: { backgroundColor: "#fee2e2" },
  listStatusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  listStatusTextAvailable: { color: "#166534" },
  listStatusTextNotAvailable: { color: "#991b1b" },
  noteText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  emptyCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
