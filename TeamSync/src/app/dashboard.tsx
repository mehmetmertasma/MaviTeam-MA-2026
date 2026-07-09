import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
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

function getFirstName(name: string, fallback: string) {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return fallback;
  }

  return trimmedName.split(" ")[0];
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

function getDashboardCopy(language: "tr" | "en") {
  if (language === "en") {
    return {
      appSubtitle: "Club management system",
      loading: "Loading",
      ready: "System ready",
      connectionIssue: "Data connection needs attention",
      loadingTitle: "Operations dashboard",
      pageEyebrow: "Operations dashboard",
      welcome: "Welcome",
      userFallback: "User",
      editProfile: "Edit profile",
      editProfileAccessLabel: "Open profile settings",
      heroLabel: "Club overview",
      workspaceLabel: "Workspace",
      clubCode: "Club code",
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
      operationStatus: "Operational status",
      steady: "On track",
      needsAttention: "Needs attention",
      open: "Open",
      roleHeroText: {
        superAdmin: {
          title: "Platform operations center",
          subtitle: "Monitor clubs, users, and platform activity from one executive view.",
        },
        clubAdmin: {
          title: "Club operations center",
          subtitle: "Manage teams, members, schedules, communication, and payments with a clean professional workflow.",
        },
        coach: {
          title: "Team operations dashboard",
          subtitle: "Manage schedule, attendance, availability, and team communication from one place.",
        },
        parent: {
          title: "Team family dashboard",
          subtitle: "Follow schedule, announcements, messages, and payment updates for your athlete.",
        },
        athlete: {
          title: "Team schedule dashboard",
          subtitle: "Access practices, matches, announcements, messages, and shared content in one place.",
        },
      } satisfies Record<UserRole, { title: string; subtitle: string }>,
      quickActionsByRole: {
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
      } satisfies Record<UserRole, QuickAction[]>,
    };
  }

  return {
    appSubtitle: "Kulüp yönetim sistemi",
    loading: "Yükleniyor",
    ready: "Sistem hazır",
    connectionIssue: "Veri bağlantısı kontrol edilmeli",
    loadingTitle: "Operasyon paneli",
    pageEyebrow: "Operasyon paneli",
    welcome: "Hoş geldin",
    userFallback: "Kullanıcı",
    editProfile: "Profili düzenle",
    editProfileAccessLabel: "Profil ayarlarını aç",
    heroLabel: "Kulüp özeti",
    workspaceLabel: "Çalışma alanı",
    clubCode: "Kulüp kodu",
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
    operationStatus: "Operasyon durumu",
    steady: "Düzenli",
    needsAttention: "Takip gerekli",
    open: "Aç",
    roleHeroText: {
      superAdmin: {
        title: "Platform operasyon merkezi",
        subtitle: "Kulüp ağını, kullanıcı akışını ve sistem durumunu tek yönetici ekranından takip et.",
      },
      clubAdmin: {
        title: "Kulüp operasyon merkezi",
        subtitle: "Takımlar, üyeler, program, iletişim ve ödemeler için profesyonel kontrol alanı.",
      },
      coach: {
        title: "Takım operasyon paneli",
        subtitle: "Program, yoklama, uygunluk ve takım iletişimini tek yerden yönet.",
      },
      parent: {
        title: "Takım takip paneli",
        subtitle: "Program, duyuru, mesaj ve ödeme bilgilerini düzenli şekilde takip et.",
      },
      athlete: {
        title: "Takım program paneli",
        subtitle: "Antrenman, maç, duyuru, mesaj ve paylaşılan içeriklere tek ekrandan ulaş.",
      },
    } satisfies Record<UserRole, { title: string; subtitle: string }>,
    quickActionsByRole: {
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
    } satisfies Record<UserRole, QuickAction[]>,
  };
}

export default function DashboardScreen() {
  const { language } = useTranslation();
  const copy = getDashboardCopy(language);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [statusMessage, setStatusMessage] = useState(copy.loading);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDashboardData() {
        try {
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
            setStatusMessage(copy.ready);
          }
        } catch {
          if (isActive) {
            setAppData(null);
            setStatusMessage(copy.connectionIssue);
          }
        }
      }

      loadDashboardData();

      return () => {
        isActive = false;
      };
    }, [copy.connectionIssue, copy.ready])
  );

  if (appData === null) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
        <View style={styles.container}>
          <View style={styles.loadingCard}>
            <Text style={styles.logo}>MaviTeam</Text>
            <Text style={styles.loadingTitle}>{copy.loadingTitle}</Text>
            <Text style={styles.loadingText}>{statusMessage}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const { club, currentUser, users, teams, announcements, scheduleEvents, payments, joinRequests } = appData;
  const activeUsers = users.filter((user) => user.status === "active");
  const athleteCount = activeUsers.filter((user) => user.role === "athlete").length;
  const pendingRequestCount = joinRequests.filter((request) => request.status === "pending").length;
  const unpaidPaymentCount = payments.filter((payment) => payment.status !== "paid").length;
  const primaryTeam = teams.find((team) => currentUser.teamIds.includes(team.id));
  const heroText = copy.roleHeroText[currentUser.role];
  const quickActions = copy.quickActionsByRole[currentUser.role];
  const upcomingEvents = getUpcomingEvents(scheduleEvents);
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
          <View style={styles.systemBadge}>
            <View style={styles.systemDot} />
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
            <Text style={styles.workspaceLabel}>{copy.workspaceLabel}</Text>
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
  loadingCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.lg,
  },
  loadingTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["3xl"],
  },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  topBarSub: {
    color: theme.colors.text.inverse,
    opacity: 0.62,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  systemBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  systemDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.state.success,
  },
  systemBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  pageTitleArea: {
    flex: 1,
    minWidth: 260,
  },
  pageEyebrow: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    opacity: 0.76,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  editProfileButton: {
    minWidth: 170,
  },
  executiveHero: {
    backgroundColor: "#111827",
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing["2xl"],
    ...theme.shadows.lg,
  },
  heroMainContent: {
    flex: 1,
    minWidth: 300,
  },
  heroLabel: {
    color: "#93C5FD",
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
    maxWidth: 680,
  },
  heroMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["3xl"],
  },
  heroMetricCard: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  heroMetricValue: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  heroMetricLabel: {
    color: "#CBD5E1",
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  workspaceCard: {
    flexGrow: 1,
    flexBasis: 260,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    justifyContent: "center",
  },
  workspaceLabel: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: theme.spacing.sm,
  },
  workspaceName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["2xl"],
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
    marginBottom: theme.spacing.xs,
  },
  workspaceCode: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  workspaceTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
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
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statHint: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
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
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  actionPanel: {
    flexGrow: 2,
    flexBasis: 560,
  },
  sidePanel: {
    flexGrow: 1,
    flexBasis: 330,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    minWidth: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    textAlign: "center",
    paddingTop: theme.spacing.sm,
    overflow: "hidden",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 96,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actionAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
  },
  actionTextArea: {
    flex: 1,
  },
  actionText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  actionOpenText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  attentionList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  attentionRow: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  attentionLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  attentionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
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
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    paddingTop: theme.spacing.xl,
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
    alignItems: "flex-start",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  eventDateBox: {
    width: 48,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm,
  },
  eventDateText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textAlign: "center",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventTime: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 210,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: theme.spacing.sm,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights.lg,
  },
});
