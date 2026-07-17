import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import { useTranslation } from "@/localization";
import { teamSyncService } from "@/services/teamSyncService";
import type { ScheduleEvent, TeamSyncAppData, UserRole } from "@/types/teamSync";

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

type QuickAction = {
  title: string;
  meta: string;
  route: AppRoute;
};

type AttentionTone = "success" | "warning" | "info";

type DashboardCopy = {
  appSubtitle: string;
  loadingLatest: string;
  ready: string;
  connectionIssue: string;
  pageEyebrow: string;
  welcome: string;
  userFallback: string;
  editProfile: string;
  editProfileAccessLabel: string;
  heroLabel: string;
  noTeam: string;
  activeMember: string;
  team: string;
  event: string;
  athlete: string;
  announcement: string;
  approval: string;
  accessOpen: string;
  registered: string;
  organized: string;
  calendar: string;
  published: string;
  pending: string;
  pendingMembers: string;
  openPayments: string;
  upcomingEvents: string;
  currentRecord: string;
  quickActionsTitle: string;
  quickActionsSubtitle: string;
  todaySummaryTitle: string;
  todaySummarySubtitle: string;
  noEvents: string;
  clubSummaryTitle: string;
  clubSummarySubtitle: string;
  club: string;
  city: string;
  clubCode: string;
  operationStatus: string;
  steady: string;
  needsAttention: string;
  open: string;
  roleHeroText: Record<UserRole, { title: string; subtitle: string }>;
  quickActionsByRole: Record<UserRole, QuickAction[]>;
};

function getFirstName(name: string, fallback: string) {
  const trimmedName = name.trim();
  return trimmedName.length === 0 ? fallback : trimmedName.split(" ")[0];
}

function formatEventTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "tr-TR" ? "Tarih yok" : "No date";
  }

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUpcomingEvents(events: ScheduleEvent[]) {
  return [...events]
    .sort((firstEvent, secondEvent) => new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime())
    .slice(0, 3);
}

function getDashboardCopy(language: "tr" | "en"): DashboardCopy {
  const roleHeroText: Record<UserRole, { title: string; subtitle: string }> = language === "en"
    ? {
      superAdmin: { title: "Platform operations center", subtitle: "Monitor clubs, users, and platform activity from one executive view." },
      clubAdmin: { title: "Club operations center", subtitle: "Manage teams, members, schedules, communication, and payments with a clean professional workflow." },
      coach: { title: "Team operations dashboard", subtitle: "Manage schedule, attendance, availability, and team communication from one place." },
      parent: { title: "Team family dashboard", subtitle: "Follow schedule, announcements, messages, and payment updates for your athlete." },
      athlete: { title: "Team schedule dashboard", subtitle: "Access practices, matches, announcements, messages, and shared content in one place." },
    }
    : {
      superAdmin: { title: "Platform operasyon merkezi", subtitle: "Kulüp ağını, kullanıcı akışını ve sistem durumunu tek yönetici ekranından takip et." },
      clubAdmin: { title: "Kulüp operasyon merkezi", subtitle: "Takımlar, üyeler, program, iletişim ve ödemeler için profesyonel kontrol alanı." },
      coach: { title: "Takım operasyon paneli", subtitle: "Program, yoklama, uygunluk ve takım iletişimini tek yerden yönet." },
      parent: { title: "Takım takip paneli", subtitle: "Program, duyuru, mesaj ve ödeme bilgilerini düzenli şekilde takip et." },
      athlete: { title: "Takım program paneli", subtitle: "Antrenman, maç, duyuru, mesaj ve paylaşılan içeriklere tek ekrandan ulaş." },
    };

  const quickActionsByRole: Record<UserRole, QuickAction[]> = language === "en"
    ? {
      superAdmin: [
        { title: "Club dashboard", meta: "Review club workspace", route: "/dashboard" },
        { title: "View statistics", meta: "Platform and club summary", route: "/statistics" },
        { title: "Account center", meta: "Open profile settings", route: "/profile" },
      ],
      clubAdmin: [
        { title: "Manage teams", meta: "Teams and rosters", route: "/teams" },
        { title: "Pending approvals", meta: "Approve new members", route: "/pending-approvals" },
        { title: "Publish announcement", meta: "Club and team updates", route: "/announcements" },
        { title: "Create schedule", meta: "Practices and matches", route: "/schedule" },
        { title: "Open messages", meta: "Team and direct chats", route: "/messages" },
        { title: "Review payments", meta: "Membership payment tracking", route: "/payments" },
      ],
      coach: [
        { title: "Manage schedule", meta: "Add practice or match", route: "/schedule" },
        { title: "Take attendance", meta: "Mark attendance status", route: "/attendance" },
        { title: "Availability", meta: "Plan participation", route: "/availability" },
        { title: "Team announcement", meta: "Open announcements", route: "/announcements" },
        { title: "Open messages", meta: "Team communication", route: "/messages" },
        { title: "Share replay", meta: "Video and drill content", route: "/replays" },
      ],
      parent: [
        { title: "View schedule", meta: "Practices and matches", route: "/schedule" },
        { title: "Read announcements", meta: "Club and team updates", route: "/announcements" },
        { title: "Send message", meta: "Team communication", route: "/messages" },
        { title: "Set availability", meta: "Submit participation status", route: "/availability" },
        { title: "Check payments", meta: "Monthly payment details", route: "/payments" },
      ],
      athlete: [
        { title: "View my schedule", meta: "Practices and matches", route: "/schedule" },
        { title: "Set availability", meta: "Submit participation status", route: "/availability" },
        { title: "Read announcements", meta: "Team updates", route: "/announcements" },
        { title: "Send message", meta: "Team communication", route: "/messages" },
        { title: "Watch replay", meta: "Shared content", route: "/replays" },
      ],
    }
    : {
      superAdmin: [
        { title: "Kulüp paneli", meta: "Kulüp verilerini görüntüle", route: "/dashboard" },
        { title: "İstatistikleri gör", meta: "Platform ve kulüp özeti", route: "/statistics" },
        { title: "Hesap merkezi", meta: "Profil ayarlarını aç", route: "/profile" },
      ],
      clubAdmin: [
        { title: "Takımları yönet", meta: "Takım listesi ve kadrolar", route: "/teams" },
        { title: "Bekleyen onaylar", meta: "Yeni üyeleri onayla", route: "/pending-approvals" },
        { title: "Duyuru yayınla", meta: "Kulüp ve takım duyuruları", route: "/announcements" },
        { title: "Program oluştur", meta: "Antrenman ve maç takvimi", route: "/schedule" },
        { title: "Mesajları aç", meta: "Takım ve bireysel mesajlar", route: "/messages" },
        { title: "Ödemeleri kontrol et", meta: "Aidat ve ödeme takibi", route: "/payments" },
      ],
      coach: [
        { title: "Programı yönet", meta: "Antrenman / maç ekle", route: "/schedule" },
        { title: "Yoklama al", meta: "Katılım durumlarını işaretle", route: "/attendance" },
        { title: "Uygunluk cevapları", meta: "Katılım planlamasını gör", route: "/availability" },
        { title: "Takım duyurusu", meta: "Duyuru ekranına git", route: "/announcements" },
        { title: "Mesajları aç", meta: "Takım iletişimi", route: "/messages" },
        { title: "Video / drill paylaş", meta: "İçerik ekranına git", route: "/replays" },
      ],
      parent: [
        { title: "Programı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
        { title: "Duyuruları oku", meta: "Kulüp ve takım duyuruları", route: "/announcements" },
        { title: "Mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
        { title: "Uygunluk bildir", meta: "Katılım durumunu gönder", route: "/availability" },
        { title: "Ödeme durumunu kontrol et", meta: "Aylık ödeme bilgileri", route: "/payments" },
      ],
      athlete: [
        { title: "Programımı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
        { title: "Uygunluk bildir", meta: "Katılım durumunu gönder", route: "/availability" },
        { title: "Duyuruları oku", meta: "Takım duyurularını gör", route: "/announcements" },
        { title: "Mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
        { title: "Video / drill izle", meta: "Paylaşılan içerikler", route: "/replays" },
      ],
    };

  if (language === "en") {
    return {
      appSubtitle: "Club management system",
      loadingLatest: "Syncing latest data...",
      ready: "System ready",
      connectionIssue: "Showing saved data",
      pageEyebrow: "Operations dashboard",
      welcome: "Welcome",
      userFallback: "User",
      editProfile: "Edit profile",
      editProfileAccessLabel: "Open profile settings",
      heroLabel: "Club overview",
      noTeam: "No team selected",
      activeMember: "Active members",
      team: "Teams",
      event: "Events",
      athlete: "Athletes",
      announcement: "Announcements",
      approval: "Approvals",
      accessOpen: "Access open",
      registered: "Registered",
      organized: "Organized",
      calendar: "Calendar",
      published: "Published",
      pending: "Pending",
      pendingMembers: "Pending memberships",
      openPayments: "Open payments",
      upcomingEvents: "Upcoming events",
      currentRecord: "Current record",
      quickActionsTitle: "Priority actions",
      quickActionsSubtitle: "The most important screens for managing your club.",
      todaySummaryTitle: "Today’s summary",
      todaySummarySubtitle: "Items that need quick attention.",
      noEvents: "No upcoming events yet.",
      clubSummaryTitle: "Club summary",
      clubSummarySubtitle: "Workspace and club details.",
      club: "Club",
      city: "City",
      clubCode: "Club code",
      operationStatus: "Operational status",
      steady: "On track",
      needsAttention: "Needs attention",
      open: "Open",
      roleHeroText,
      quickActionsByRole,
    };
  }

  return {
    appSubtitle: "Kulüp yönetim sistemi",
    loadingLatest: "Güncel veri eşitleniyor...",
    ready: "Sistem hazır",
    connectionIssue: "Kayıtlı veri gösteriliyor",
    pageEyebrow: "Operasyon paneli",
    welcome: "Hoş geldin",
    userFallback: "Kullanıcı",
    editProfile: "Profili düzenle",
    editProfileAccessLabel: "Profil ayarlarını aç",
    heroLabel: "Kulüp özeti",
    noTeam: "Takım seçilmedi",
    activeMember: "Aktif üye",
    team: "Takım",
    event: "Etkinlik",
    athlete: "Sporcu",
    announcement: "Duyuru",
    approval: "Onay",
    accessOpen: "Erişim açık",
    registered: "Kayıtlı",
    organized: "Organize",
    calendar: "Takvim",
    published: "Yayın",
    pending: "Bekleyen",
    pendingMembers: "Bekleyen üyelik",
    openPayments: "Açık ödeme",
    upcomingEvents: "Yaklaşan etkinlik",
    currentRecord: "Güncel kayıt",
    quickActionsTitle: "Öncelikli işlemler",
    quickActionsSubtitle: "Kulübü yönetmek için en önemli ekranlar.",
    todaySummaryTitle: "Bugünün özeti",
    todaySummarySubtitle: "Hızlı takip edilmesi gereken başlıklar.",
    noEvents: "Henüz etkinlik yok.",
    clubSummaryTitle: "Kulüp özeti",
    clubSummarySubtitle: "Çalışma alanı ve kulüp bilgileri.",
    club: "Kulüp",
    city: "Şehir",
    clubCode: "Kulüp kodu",
    operationStatus: "Operasyon durumu",
    steady: "Düzenli",
    needsAttention: "Takip gerekli",
    open: "Aç",
    roleHeroText,
    quickActionsByRole,
  };
}

export default function DashboardScreen() {
  const { language } = useTranslation();
  const copy = getDashboardCopy(language);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const [appData, setAppData] = useState<TeamSyncAppData>(initialTeamSyncData);
  const [statusMessage, setStatusMessage] = useState(copy.loadingLatest);
  const [isRefreshing, setIsRefreshing] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshDashboardData() {
        try {
          setIsRefreshing(true);
          setStatusMessage(copy.loadingLatest);
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
            setStatusMessage(copy.ready);
          }
        } catch {
          if (isActive) {
            setStatusMessage(copy.connectionIssue);
          }
        } finally {
          if (isActive) {
            setIsRefreshing(false);
          }
        }
      }

      refreshDashboardData();

      return () => {
        isActive = false;
      };
    }, [copy.connectionIssue, copy.loadingLatest, copy.ready])
  );

  const { club, currentUser, users, teams, announcements, scheduleEvents, payments, joinRequests } = appData;
  const activeUsers = users.filter((user) => user.status === "active");
  const athleteCount = activeUsers.filter((user) => user.role === "athlete").length;
  const pendingRequestCount = joinRequests.filter((request) => request.status === "pending").length;
  const unpaidPaymentCount = payments.filter((payment) => payment.status !== "paid").length;
  const primaryTeam = teams.find((team) => currentUser.teamIds.includes(team.id));
  const heroText = copy.roleHeroText[currentUser.role];
  const quickActions = copy.quickActionsByRole[currentUser.role];
  const upcomingEvents = useMemo(() => getUpcomingEvents(scheduleEvents), [scheduleEvents]);
  const heroMetrics = [
    { label: copy.activeMember, value: String(activeUsers.length) },
    { label: copy.team, value: String(teams.length) },
    { label: copy.event, value: String(scheduleEvents.length) },
  ];
  const stats = [
    { label: copy.activeMember, value: String(activeUsers.length), hint: copy.accessOpen },
    { label: copy.athlete, value: String(athleteCount), hint: copy.registered },
    { label: copy.team, value: String(teams.length), hint: copy.organized },
    { label: copy.event, value: String(scheduleEvents.length), hint: copy.calendar },
    { label: copy.announcement, value: String(announcements.length), hint: copy.published },
    { label: copy.approval, value: String(pendingRequestCount), hint: copy.pending },
  ];
  const attentionItems: { label: string; value: string; tone: AttentionTone }[] = [
    { label: copy.pendingMembers, value: String(pendingRequestCount), tone: pendingRequestCount > 0 ? "warning" : "success" },
    { label: copy.openPayments, value: String(unpaidPaymentCount), tone: unpaidPaymentCount > 0 ? "warning" : "success" },
    { label: copy.upcomingEvents, value: String(Math.min(scheduleEvents.length, 3)), tone: "info" },
  ];
  const overview = [
    { label: copy.club, value: club.name },
    { label: copy.team, value: primaryTeam?.name ?? copy.noTeam },
    { label: copy.clubCode, value: club.code },
    { label: copy.city, value: club.city || "—" },
    { label: copy.operationStatus, value: unpaidPaymentCount === 0 && pendingRequestCount === 0 ? copy.steady : copy.needsAttention },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>MaviTeam</Text>
            <Text style={styles.topBarSub}>{copy.appSubtitle}</Text>
          </View>
          <View style={[styles.systemBadge, isRefreshing ? styles.systemBadgeSyncing : null]}>
            <View style={[styles.systemDot, isRefreshing ? styles.systemDotSyncing : null]} />
            <Text style={styles.systemBadgeText}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.pageTitleArea}>
            <Text style={styles.pageEyebrow}>{copy.pageEyebrow}</Text>
            <Text style={styles.welcome}>
              {copy.welcome}, {getFirstName(currentUser.fullName, copy.userFallback)}
            </Text>
            <Text style={styles.subtitle}>{club.name}</Text>
          </View>

          <AppButton
            title={copy.editProfile}
            variant="secondary"
            accessibilityLabel={copy.editProfileAccessLabel}
            style={styles.editProfileButton}
            onPress={() => router.push("/profile" as never)}
          />
        </View>

        <View style={styles.executiveHero}>
          <View style={styles.heroMainContent}>
            <Text style={styles.heroLabel}>{copy.heroLabel}</Text>
            <Text style={styles.heroTitle}>{heroText.title}</Text>
            <Text style={styles.heroSubtitle}>{heroText.subtitle}</Text>

            <View style={styles.heroMetricRow}>
              {heroMetrics.map((metric) => (
                <View key={metric.label} style={styles.heroMetricCard}>
                  <Text style={styles.heroMetricValue}>{metric.value}</Text>
                  <Text style={styles.heroMetricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.workspaceCard}>
            <Text style={styles.workspaceLabel}>{copy.club}</Text>
            <Text style={styles.workspaceName}>{club.name}</Text>
            <View style={styles.workspaceDivider} />
            <Text style={styles.workspaceMetaLabel}>{copy.clubCode}</Text>
            <Text style={styles.workspaceCode}>{club.code}</Text>
            <Text style={styles.workspaceTeam}>{primaryTeam?.name ?? copy.noTeam}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statHint}>{stat.hint}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mainGrid}>
          <View style={[styles.panel, styles.actionPanel]}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>{copy.quickActionsTitle}</Text>
                <Text style={styles.panelSubtitle}>{copy.quickActionsSubtitle}</Text>
              </View>
              <Text style={styles.panelCount}>{quickActions.length}</Text>
            </View>

            <View style={styles.actionGrid}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.title}
                  onPress={() => router.push(action.route as never)}
                  style={({ pressed }) => [styles.actionCard, pressed ? styles.cardPressed : null]}
                >
                  <View style={styles.actionAccent} />
                  <View style={styles.actionTextArea}>
                    <Text style={styles.actionText}>{action.title}</Text>
                    <Text style={styles.actionMeta}>{action.meta}</Text>
                  </View>
                  <Text style={styles.actionOpenText}>{copy.open}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.panel, styles.sidePanel]}>
            <View style={styles.panelHeaderCompact}>
              <Text style={styles.panelTitle}>{copy.todaySummaryTitle}</Text>
              <Text style={styles.panelSubtitle}>{copy.todaySummarySubtitle}</Text>
            </View>

            <View style={styles.attentionList}>
              {attentionItems.map((item) => (
                <View key={item.label} style={styles.attentionRow}>
                  <View>
                    <Text style={styles.attentionLabel}>{item.label}</Text>
                    <Text style={styles.attentionMeta}>{copy.currentRecord}</Text>
                  </View>
                  <Text
                    style={[
                      styles.attentionValue,
                      item.tone === "warning" ? styles.attentionWarning : null,
                      item.tone === "success" ? styles.attentionSuccess : null,
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.eventBlock}>
              <Text style={styles.blockTitle}>{copy.upcomingEvents}</Text>
              {upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>{copy.noEvents}</Text>
              ) : (
                <View style={styles.eventList}>
                  {upcomingEvents.map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View style={styles.eventDateBox}>
                        <Text style={styles.eventDateText}>{formatEventTime(event.startsAt, locale).split(" ")[0]}</Text>
                      </View>

                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventTime}>{formatEventTime(event.startsAt, locale)}</Text>
                        <Text style={styles.eventLocation}>{event.location}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeaderCompact}>
            <Text style={styles.panelTitle}>{copy.clubSummaryTitle}</Text>
            <Text style={styles.panelSubtitle}>{copy.clubSummarySubtitle}</Text>
          </View>

          <View style={styles.overviewGrid}>
            {overview.map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  topBarSub: {
    color: theme.colors.text.inverse,
    opacity: 0.7,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  systemBadge: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  systemBadgeSyncing: {
    opacity: 0.86,
  },
  systemDot: {
    width: 9,
    height: 9,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.text.success,
  },
  systemDotSyncing: {
    backgroundColor: theme.colors.brand.primary,
  },
  systemBadgeText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
  },
  pageTitleArea: {
    flex: 1,
  },
  pageEyebrow: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  welcome: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.inverse,
    opacity: 0.72,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
  },
  editProfileButton: {
    minWidth: 160,
  },
  executiveHero: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    flexDirection: "row",
    gap: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  heroMainContent: {
    flex: 1,
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
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    lineHeight: theme.lineHeights.xl,
    fontWeight: theme.fontWeights.semibold,
    maxWidth: 700,
  },
  heroMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  heroMetricCard: {
    minWidth: 120,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  heroMetricValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
  },
  heroMetricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginTop: theme.spacing.xs,
  },
  workspaceCard: {
    width: 260,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  workspaceLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  workspaceName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights.xl,
  },
  workspaceDivider: {
    height: 1,
    backgroundColor: theme.colors.border.default,
    marginVertical: theme.spacing.lg,
  },
  workspaceMetaLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  workspaceCode: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.xs,
  },
  workspaceTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  statHint: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginTop: theme.spacing.xs,
  },
  mainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
  },
  panel: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  actionPanel: {
    flex: 2,
    minWidth: 360,
  },
  sidePanel: {
    flex: 1,
    minWidth: 300,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  panelHeaderCompact: {
    marginBottom: theme.spacing.xl,
  },
  panelTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  panelSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  panelCount: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  actionAccent: {
    width: 5,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
  },
  actionTextArea: {
    flex: 1,
  },
  actionText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  actionOpenText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  attentionList: {
    gap: theme.spacing.md,
  },
  attentionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  attentionLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  attentionMeta: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  attentionValue: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  attentionWarning: {
    color: theme.colors.text.warning,
  },
  attentionSuccess: {
    color: theme.colors.text.success,
  },
  eventBlock: {
    marginTop: theme.spacing["2xl"],
  },
  blockTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  eventList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  eventDateBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.brand.primarySoft,
  },
  eventDateText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  eventTime: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  eventLocation: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
});
