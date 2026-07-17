import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type { Club, ScheduleEvent, Team, UserProfile, UserRole } from "@/types/teamSync";

type AppRoute =
  | "/dashboard"
  | "/teams"
  | "/pending-approvals"
  | "/announcements"
  | "/messages"
  | "/schedule"
  | "/attendance"
  | "/availability"
  | "/statistics"
  | "/replays"
  | "/payments"
  | "/profile";

type DashboardState = {
  club: Club;
  currentUser: UserProfile;
  teams: Team[];
  scheduleEvents: ScheduleEvent[];
};

type QuickAction = {
  title: string;
  meta: string;
  route: AppRoute;
};

function getFirstName(name: string, fallback: string) {
  const trimmedName = name.trim();
  return trimmedName.length === 0 ? fallback : trimmedName.split(" ")[0];
}

function getUpcomingEvents(events: ScheduleEvent[]) {
  return [...events]
    .sort((firstEvent, secondEvent) => new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime())
    .slice(0, 3);
}

function formatEventTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "tr-TR" ? "Tarih yok" : "No date";
  return date.toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  const quickActionsByRole: Record<UserRole, QuickAction[]> = {
    superAdmin: [
      { title: en ? "Statistics" : "İstatistikler", meta: en ? "Review platform data" : "Platform verilerini gör", route: "/statistics" },
      { title: en ? "Profile" : "Profil", meta: en ? "Account settings" : "Hesap ayarları", route: "/profile" },
    ],
    clubAdmin: [
      { title: en ? "Teams" : "Takımlar", meta: en ? "Manage teams" : "Takımları yönet", route: "/teams" },
      { title: en ? "Approvals" : "Onaylar", meta: en ? "Approve members" : "Üyeleri onayla", route: "/pending-approvals" },
      { title: en ? "Schedule" : "Program", meta: en ? "Practices and matches" : "Antrenman ve maçlar", route: "/schedule" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Club updates" : "Kulüp güncellemeleri", route: "/announcements" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team communication" : "Takım iletişimi", route: "/messages" },
      { title: en ? "Payments" : "Ödemeler", meta: en ? "Payment tracking" : "Ödeme takibi", route: "/payments" },
    ],
    coach: [
      { title: en ? "Schedule" : "Program", meta: en ? "Manage practices" : "Antrenmanları yönet", route: "/schedule" },
      { title: en ? "Attendance" : "Yoklama", meta: en ? "Take attendance" : "Yoklama al", route: "/attendance" },
      { title: en ? "Availability" : "Uygunluk", meta: en ? "Plan participation" : "Katılımı planla", route: "/availability" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team communication" : "Takım iletişimi", route: "/messages" },
      { title: en ? "Replays" : "Replayler", meta: en ? "Share links" : "Link paylaş", route: "/replays" },
    ],
    parent: [
      { title: en ? "Schedule" : "Program", meta: en ? "View practices" : "Antrenmanları gör", route: "/schedule" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Read updates" : "Güncellemeleri oku", route: "/announcements" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team chat" : "Takım sohbeti", route: "/messages" },
      { title: en ? "Payments" : "Ödemeler", meta: en ? "Payment status" : "Ödeme durumu", route: "/payments" },
    ],
    athlete: [
      { title: en ? "Schedule" : "Program", meta: en ? "View my schedule" : "Programımı gör", route: "/schedule" },
      { title: en ? "Availability" : "Uygunluk", meta: en ? "Submit status" : "Durum bildir", route: "/availability" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Team updates" : "Takım duyuruları", route: "/announcements" },
      { title: en ? "Replays" : "Replayler", meta: en ? "Shared content" : "Paylaşılan içerikler", route: "/replays" },
    ],
  };

  return {
    appSubtitle: en ? "Club management system" : "Kulüp yönetim sistemi",
    loading: en ? "Loading workspace..." : "Çalışma alanı yükleniyor...",
    ready: en ? "System ready" : "Sistem hazır",
    error: en ? "Workspace could not be loaded. Try again." : "Çalışma alanı yüklenemedi. Tekrar dene.",
    setup: en ? "Workspace setup required" : "Kulüp kurulumu gerekli",
    setupText: en ? "This account does not have a club yet." : "Bu hesapta henüz gerçek kulüp yok.",
    createClub: en ? "Create club" : "Kulüp oluştur",
    retry: en ? "Try again" : "Tekrar dene",
    pageTitle: en ? "Operations dashboard" : "Operasyon paneli",
    welcome: en ? "Welcome" : "Hoş geldin",
    userFallback: en ? "User" : "Kullanıcı",
    editProfile: en ? "Edit profile" : "Profili düzenle",
    activeClub: en ? "Active club" : "Aktif kulüp",
    teams: en ? "Teams" : "Takımlar",
    events: en ? "Events" : "Etkinlikler",
    role: en ? "Role" : "Rol",
    quickActions: en ? "Quick actions" : "Hızlı işlemler",
    upcomingEvents: en ? "Upcoming events" : "Yaklaşan etkinlikler",
    noEvents: en ? "No events yet." : "Henüz etkinlik yok.",
    open: en ? "Open" : "Aç",
    clubCode: en ? "Club code" : "Kulüp kodu",
    city: en ? "City" : "Şehir",
    noCity: en ? "No city" : "Şehir yok",
    quickActionsByRole,
  };
}

async function safeLoadTeams(clubId: string) {
  try {
    return await firestoreTeamSyncService.listTeamsForClub(clubId);
  } catch (error) {
    console.warn("Dashboard teams could not be loaded.", error);
    return [];
  }
}

async function safeLoadScheduleEvents(clubId: string) {
  try {
    return await firestoreTeamSyncService.listScheduleEventsForClub(clubId);
  } catch (error) {
    console.warn("Dashboard schedule could not be loaded.", error);
    return [];
  }
}

export default function DashboardScreen() {
  const { language } = useTranslation();
  const copy = getCopy(language);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const [dashboardData, setDashboardData] = useState<DashboardState | null>(null);
  const [statusMessage, setStatusMessage] = useState(copy.loading);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDashboard() {
        setStatusMessage(copy.loading);
        setNeedsSetup(false);

        try {
          const firebaseUser = authService.getCurrentUser();
          if (authService.isConfigured() && firebaseUser === null) {
            router.replace("/login" as never);
            return;
          }

          if (firebaseUser === null) {
            setStatusMessage(copy.error);
            return;
          }

          const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);
          if (!isActive) return;

          if (workspace === null || workspace.club === null) {
            setDashboardData(null);
            setNeedsSetup(true);
            setStatusMessage(copy.setup);
            return;
          }

          const [teams, scheduleEvents] = await Promise.all([
            safeLoadTeams(workspace.club.id),
            safeLoadScheduleEvents(workspace.club.id),
          ]);

          if (!isActive) return;

          setDashboardData({
            club: workspace.club,
            currentUser: workspace.currentUser,
            teams,
            scheduleEvents,
          });
          setStatusMessage(copy.ready);
        } catch (error) {
          console.warn("Dashboard workspace could not be loaded.", error);
          if (isActive) {
            setDashboardData(null);
            setStatusMessage(copy.error);
          }
        }
      }

      loadDashboard();

      return () => {
        isActive = false;
      };
    }, [copy.error, copy.loading, copy.ready, copy.setup, loadVersion])
  );

  if (dashboardData === null) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
        <View style={styles.container}>
          <View style={styles.loadingCard}>
            <Text style={styles.logo}>MaviTeam</Text>
            <Text style={styles.loadingTitle}>{needsSetup ? copy.setup : copy.pageTitle}</Text>
            <Text style={styles.loadingText}>{needsSetup ? copy.setupText : statusMessage}</Text>
            <View style={styles.loadingActions}>
              {needsSetup ? (
                <AppButton title={copy.createClub} onPress={() => router.replace("/create-club" as never)} />
              ) : (
                <AppButton title={copy.retry} onPress={() => setLoadVersion((value) => value + 1)} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  const { club, currentUser, teams, scheduleEvents } = dashboardData;
  const upcomingEvents = getUpcomingEvents(scheduleEvents);
  const quickActions = copy.quickActionsByRole[currentUser.role];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>MaviTeam</Text>
            <Text style={styles.topBarSub}>{copy.appSubtitle}</Text>
          </View>
          <View style={styles.systemBadge}>
            <View style={styles.systemDot} />
            <Text style={styles.systemBadgeText}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.pageTitleArea}>
            <Text style={styles.pageEyebrow}>{copy.pageTitle}</Text>
            <Text style={styles.welcome}>{copy.welcome}, {getFirstName(currentUser.fullName, copy.userFallback)}</Text>
            <Text style={styles.subtitle}>{club.name}</Text>
          </View>
          <AppButton title={copy.editProfile} variant="secondary" style={styles.editProfileButton} onPress={() => router.push("/profile" as never)} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statHint}>{copy.activeClub}</Text><Text style={styles.statValue}>1</Text><Text style={styles.statLabel}>{club.name}</Text></View>
          <View style={styles.statCard}><Text style={styles.statHint}>{copy.teams}</Text><Text style={styles.statValue}>{teams.length}</Text><Text style={styles.statLabel}>{copy.teams}</Text></View>
          <View style={styles.statCard}><Text style={styles.statHint}>{copy.events}</Text><Text style={styles.statValue}>{scheduleEvents.length}</Text><Text style={styles.statLabel}>{copy.events}</Text></View>
          <View style={styles.statCard}><Text style={styles.statHint}>{copy.role}</Text><Text style={styles.statValueSmall}>{currentUser.role}</Text><Text style={styles.statLabel}>{currentUser.status}</Text></View>
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{copy.quickActions}</Text>
            <View style={styles.actionGrid}>
              {quickActions.map((action) => (
                <Pressable key={action.title} onPress={() => router.push(action.route as never)} style={({ pressed }) => [styles.actionCard, pressed ? styles.cardPressed : null]}>
                  <View style={styles.actionTextArea}>
                    <Text style={styles.actionText}>{action.title}</Text>
                    <Text style={styles.actionMeta}>{action.meta}</Text>
                  </View>
                  <Text style={styles.actionOpenText}>{copy.open}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{copy.upcomingEvents}</Text>
            {upcomingEvents.length === 0 ? (
              <Text style={styles.emptyText}>{copy.noEvents}</Text>
            ) : upcomingEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{formatEventTime(event.startsAt, locale)}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{copy.activeClub}</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.infoCard}><Text style={styles.infoLabel}>{copy.clubCode}</Text><Text style={styles.infoValue}>{club.code}</Text></View>
            <View style={styles.infoCard}><Text style={styles.infoLabel}>{copy.city}</Text><Text style={styles.infoValue}>{club.city || copy.noCity}</Text></View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: { padding: theme.spacing.xl, paddingBottom: theme.spacing["4xl"] },
  container: { width: "100%", maxWidth: 1180, alignSelf: "center", gap: theme.spacing.xl },
  loadingCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing["3xl"], ...theme.shadows.md },
  loadingTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, marginTop: theme.spacing.xl },
  loadingText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.bold, marginTop: theme.spacing.md },
  loadingActions: { marginTop: theme.spacing.xl, alignSelf: "flex-start" },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black },
  topBar: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg },
  topBarSub: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },
  systemBadge: { borderRadius: theme.radius.full, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  systemDot: { width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.state.success },
  systemBadgeText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold },
  pageHeader: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing["2xl"], flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.xl },
  pageTitleArea: { flex: 1 },
  pageEyebrow: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  welcome: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black },
  subtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.bold, marginTop: theme.spacing.sm },
  editProfileButton: { alignSelf: "flex-start" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  statCard: { flexGrow: 1, flexBasis: 160, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.lg },
  statHint: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black },
  statValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.black, marginVertical: theme.spacing.xs },
  statValueSmall: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginVertical: theme.spacing.sm },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold },
  mainGrid: { flexDirection: "row", gap: theme.spacing.xl },
  panel: { flex: 1, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.xl, gap: theme.spacing.lg },
  panelTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black },
  actionGrid: { gap: theme.spacing.md },
  actionCard: { borderRadius: theme.radius.xl, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md },
  actionTextArea: { flex: 1 },
  actionText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  actionMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },
  actionOpenText: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  eventCard: { borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.subtle, padding: theme.spacing.md, gap: theme.spacing.xs },
  eventTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  eventTime: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  eventLocation: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  infoCard: { flexGrow: 1, flexBasis: 180, borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.subtle, padding: theme.spacing.md },
  infoLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginTop: theme.spacing.xs },
  cardPressed: { opacity: 0.72 },
});