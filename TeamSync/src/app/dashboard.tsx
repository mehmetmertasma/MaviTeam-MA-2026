import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import type { UserRole } from "@/types/teamSync";

type AppRoute =
  | "/teams"
  | "/members"
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

type QuickAction = {
  title: string;
  meta: string;
  route: AppRoute;
};

function getFirstName(name: string, fallback: string) {
  const trimmedName = name.trim();
  return trimmedName.length === 0 ? fallback : trimmedName.split(" ")[0];
}

function getUpcomingEvents<T extends { startsAt: string }>(events: T[]) {
  return [...events]
    .sort((firstEvent, secondEvent) => new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime())
    .slice(0, 3);
}

function formatEventTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "tr-TR" ? "Tarih yok" : "No date";
  return date.toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatAnnouncementDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short" });
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
      { title: en ? "Members" : "Üyeler", meta: en ? "Roles and team access" : "Rol ve takım erişimi", route: "/members" },
      { title: en ? "Approvals" : "Onaylar", meta: en ? "Approve members" : "Üyeleri onayla", route: "/pending-approvals" },
      { title: en ? "Schedule" : "Program", meta: en ? "Practices and matches" : "Antrenman ve maçlar", route: "/schedule" },
      { title: en ? "Attendance" : "Yoklama", meta: en ? "Take attendance" : "Yoklama al", route: "/attendance" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Club updates" : "Kulüp güncellemeleri", route: "/announcements" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team communication" : "Takım iletişimi", route: "/messages" },
      { title: en ? "Payments" : "Ödemeler", meta: en ? "Payment tracking" : "Ödeme takibi", route: "/payments" },
    ],
    coach: [
      { title: en ? "Schedule" : "Program", meta: en ? "Manage practices" : "Antrenmanları yönet", route: "/schedule" },
      { title: en ? "Attendance" : "Yoklama", meta: en ? "Take attendance" : "Yoklama al", route: "/attendance" },
      { title: en ? "Availability" : "Uygunluk", meta: en ? "Plan participation" : "Katılımı planla", route: "/availability" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team communication" : "Takım iletişimi", route: "/messages" },
      { title: en ? "Replays" : "Replayler", meta: en ? "Shared links" : "Paylaşılan linkler", route: "/replays" },
    ],
    parent: [
      { title: en ? "Schedule" : "Program", meta: en ? "View practices" : "Antrenmanları gör", route: "/schedule" },
      { title: en ? "Attendance" : "Yoklama", meta: en ? "View attendance" : "Yoklamayı gör", route: "/attendance" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Read updates" : "Güncellemeleri oku", route: "/announcements" },
      { title: en ? "Messages" : "Mesajlar", meta: en ? "Team chat" : "Takım sohbeti", route: "/messages" },
      { title: en ? "Payments" : "Ödemeler", meta: en ? "Payment status" : "Ödeme durumu", route: "/payments" },
    ],
    athlete: [
      { title: en ? "Schedule" : "Program", meta: en ? "View my schedule" : "Programımı gör", route: "/schedule" },
      { title: en ? "Attendance" : "Yoklama", meta: en ? "View attendance" : "Yoklamayı gör", route: "/attendance" },
      { title: en ? "Availability" : "Uygunluk", meta: en ? "Submit status" : "Durum bildir", route: "/availability" },
      { title: en ? "Announcements" : "Duyurular", meta: en ? "Team updates" : "Takım duyuruları", route: "/announcements" },
      { title: en ? "Replays" : "Replayler", meta: en ? "Shared content" : "Paylaşılan içerikler", route: "/replays" },
    ],
  };

  const roleLabels: Record<UserRole, string> = {
    superAdmin: en ? "Platform admin" : "Platform yöneticisi",
    clubAdmin: en ? "Club admin" : "Kulüp yöneticisi",
    coach: en ? "Coach" : "Koç",
    parent: en ? "Parent" : "Veli",
    athlete: en ? "Athlete" : "Sporcu",
  };

  return {
    appSubtitle: en ? "Club management system" : "Kulüp yönetim sistemi",
    loading: en ? "Loading workspace..." : "Çalışma alanı yükleniyor...",
    ready: en ? "System ready" : "Sistem hazır",
    error: en ? "Workspace could not be loaded." : "Çalışma alanı yüklenemedi.",
    errorDescription: en
      ? "Check your connection and try again."
      : "Bağlantını kontrol edip tekrar dene.",
    setup: en ? "Workspace setup required" : "Kulüp kurulumu gerekli",
    setupText: en ? "This account does not have a club yet." : "Bu hesapta henüz bir kulüp yok.",
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
    pendingApprovals: en ? "Pending approvals" : "Bekleyen onaylar",
    pendingApprovalsMeta: en ? "Waiting for your review" : "İncelemeni bekliyor",
    outstandingPayments: en ? "Outstanding payments" : "Bekleyen ödemeler",
    outstandingPaymentsMeta: en ? "Needs attention" : "İlgilenmen gerekiyor",
    latestAnnouncement: en ? "Latest announcement" : "Son duyuru",
    noAnnouncements: en ? "No announcements yet." : "Henüz duyuru yok.",
    viewAll: en ? "View all" : "Tümünü gör",
    quickActionsByRole,
    roleLabels,
  };
}

export default function DashboardScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { isDesktop } = useResponsive();
  const { appData, isLoading, error: appDataError, refresh } = useAppDataContext();

  if (appData === null && isLoading) {
    return (
      <AppScreenLayout variant="wide">
        <LoadingState label={copy.loading} />
      </AppScreenLayout>
    );
  }

  if (appData === null && appDataError !== null) {
    return (
      <AppScreenLayout variant="wide">
        <ErrorState
          title={copy.error}
          description={copy.errorDescription}
          retryLabel={copy.retry}
          onRetry={() => {
            refresh().catch(() => {});
          }}
        />
      </AppScreenLayout>
    );
  }

  if (appData === null) {
    return (
      <AppScreenLayout variant="wide">
        <LoadingState label={copy.loading} />
      </AppScreenLayout>
    );
  }

  if (appData.club.id === "") {
    return (
      <AppScreenLayout variant="wide">
        <EmptyState
          title={copy.setup}
          description={copy.setupText}
          actionLabel={copy.createClub}
          onAction={() => router.replace("/create-club" as never)}
        />
      </AppScreenLayout>
    );
  }

  const { club, currentUser, teams, scheduleEvents, payments, joinRequests, announcements } = appData;
  const upcomingEvents = getUpcomingEvents(scheduleEvents);
  const quickActions = copy.quickActionsByRole[currentUser.role];

  const pendingApprovalsCount = joinRequests.filter((request) => request.status === "pending").length;
  const myOutstandingPaymentsCount = payments.filter(
    (payment) => payment.userId === currentUser.id && payment.status !== "paid"
  ).length;
  const showPendingApprovals = (currentUser.role === "clubAdmin" || currentUser.role === "superAdmin") && pendingApprovalsCount > 0;
  const showOutstandingPayments = myOutstandingPaymentsCount > 0;

  const latestAnnouncement = [...announcements].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  )[0];

  return (
    <AppScreenLayout variant="wide">
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>MaviTeam</Text>
          <Text style={styles.topBarSub}>{copy.appSubtitle}</Text>
        </View>
        <View style={styles.systemBadge}>
          <View style={styles.systemDot} />
          <Text style={styles.systemBadgeText}>{copy.ready}</Text>
        </View>
      </View>

      <PageHeader
        eyebrow={copy.pageTitle}
        title={`${copy.welcome}, ${getFirstName(currentUser.fullName, copy.userFallback)}`}
        subtitle={club.name}
        badge={<StatusBadge label={copy.roleLabels[currentUser.role]} tone="info" />}
        action={<AppButton title={copy.editProfile} variant="secondary" style={styles.editProfileButton} onPress={() => router.push("/profile" as never)} />}
      />

      {showPendingApprovals || showOutstandingPayments ? (
        <View style={[styles.highlightRow, isDesktop ? null : styles.highlightRowStacked]}>
          {showPendingApprovals ? (
            <Pressable onPress={() => router.push("/pending-approvals" as never)} style={({ pressed }) => [styles.highlightCardWrapper, pressed ? styles.cardPressed : null]}>
              <Card variant="elevated" style={styles.highlightCard}>
                <StatusBadge label={copy.pendingApprovals} tone="warning" />
                <Text style={styles.highlightValue}>{pendingApprovalsCount}</Text>
                <Text style={styles.highlightMeta}>{copy.pendingApprovalsMeta}</Text>
              </Card>
            </Pressable>
          ) : null}

          {showOutstandingPayments ? (
            <Pressable onPress={() => router.push("/payments" as never)} style={({ pressed }) => [styles.highlightCardWrapper, pressed ? styles.cardPressed : null]}>
              <Card variant="elevated" style={styles.highlightCard}>
                <StatusBadge label={copy.outstandingPayments} tone="danger" />
                <Text style={styles.highlightValue}>{myOutstandingPaymentsCount}</Text>
                <Text style={styles.highlightMeta}>{copy.outstandingPaymentsMeta}</Text>
              </Card>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statHint}>{copy.activeClub}</Text><Text style={styles.statValue}>1</Text><Text style={styles.statLabel}>{club.name}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statHint}>{copy.teams}</Text><Text style={styles.statValue}>{teams.length}</Text><Text style={styles.statLabel}>{copy.teams}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statHint}>{copy.events}</Text><Text style={styles.statValue}>{scheduleEvents.length}</Text><Text style={styles.statLabel}>{copy.events}</Text></Card>
        <Card style={styles.statCard}>
          <Text style={styles.statHint}>{copy.role}</Text>
          <StatusBadge label={copy.roleLabels[currentUser.role]} tone="neutral" style={styles.statRoleBadge} />
        </Card>
      </View>

      <View style={[styles.mainGrid, isDesktop ? null : styles.mainGridStacked]}>
        <Card style={styles.panel}>
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
        </Card>

        <Card style={styles.panel}>
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
        </Card>
      </View>

      <Card style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>{copy.latestAnnouncement}</Text>
          <Pressable onPress={() => router.push("/announcements" as never)}>
            <Text style={styles.viewAllText}>{copy.viewAll}</Text>
          </Pressable>
        </View>

        {latestAnnouncement === undefined ? (
          <Text style={styles.emptyText}>{copy.noAnnouncements}</Text>
        ) : (
          <Pressable onPress={() => router.push("/announcements" as never)} style={({ pressed }) => [styles.announcementCard, pressed ? styles.cardPressed : null]}>
            <View style={styles.announcementHeaderRow}>
              <Text style={styles.announcementTitle} numberOfLines={1}>{latestAnnouncement.title}</Text>
              <Text style={styles.announcementDate}>{formatAnnouncementDate(latestAnnouncement.createdAt, locale)}</Text>
            </View>
            <Text style={styles.announcementMessage} numberOfLines={2}>{latestAnnouncement.message}</Text>
          </Pressable>
        )}
      </Card>

      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>{copy.activeClub}</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.infoCard}><Text style={styles.infoLabel}>{copy.clubCode}</Text><Text style={styles.infoValue}>{club.code}</Text></View>
          <View style={styles.infoCard}><Text style={styles.infoLabel}>{copy.city}</Text><Text style={styles.infoValue}>{club.city || copy.noCity}</Text></View>
        </View>
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  topBar: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.bold },
  topBarSub: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xs },
  systemBadge: { borderRadius: theme.radius.full, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  systemDot: { width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.state.success },
  systemBadgeText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },

  editProfileButton: { alignSelf: "flex-start" },

  highlightRow: { flexDirection: "row", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  highlightRowStacked: { flexDirection: "column" },
  highlightCardWrapper: { flex: 1 },
  highlightCard: { gap: theme.spacing.sm },
  highlightValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold },
  highlightMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  statCard: { flexGrow: 1, flexBasis: 160, padding: theme.spacing.lg },
  statHint: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium },
  statValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.bold, marginVertical: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  statRoleBadge: { marginTop: theme.spacing.sm },

  mainGrid: { flexDirection: "row", gap: theme.spacing.xl, marginBottom: theme.spacing.xl },
  mainGridStacked: { flexDirection: "column" },
  panel: { flex: 1, gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  panelHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  panelTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold },
  viewAllText: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },

  actionGrid: { gap: theme.spacing.md },
  actionCard: { borderRadius: theme.radius.xl, backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md },
  actionTextArea: { flex: 1 },
  actionText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  actionMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xs },
  actionOpenText: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },

  eventCard: { borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.subtle, padding: theme.spacing.md, gap: theme.spacing.xs },
  eventTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  eventTime: { color: theme.colors.brand.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  eventLocation: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },

  announcementCard: { borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.subtle, padding: theme.spacing.lg, gap: theme.spacing.xs },
  announcementHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.md },
  announcementTitle: { flex: 1, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  announcementDate: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium },
  announcementMessage: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.sm },

  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },

  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  infoCard: { flexGrow: 1, flexBasis: 180, borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.subtle, padding: theme.spacing.md },
  infoLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xs },

  cardPressed: { opacity: 0.72 },
});