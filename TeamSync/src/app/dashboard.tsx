import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

function getDashboardCopy(language: "tr" | "en") {
  const isEnglish = language === "en";

  return {
    appSubtitle: isEnglish ? "Club management system" : "Kulüp yönetim sistemi",
    loading: isEnglish ? "Loading real workspace data..." : "Gerçek çalışma alanı verisi yükleniyor...",
    ready: isEnglish ? "System ready" : "Sistem hazır",
    connectionIssue: isEnglish ? "Real workspace data could not be loaded" : "Gerçek çalışma alanı verisi yüklenemedi",
    loadingTitle: isEnglish ? "Operations dashboard" : "Operasyon paneli",
    pageEyebrow: isEnglish ? "Operations dashboard" : "Operasyon paneli",
    welcome: isEnglish ? "Welcome" : "Hoş geldin",
    userFallback: isEnglish ? "User" : "Kullanıcı",
    editProfile: isEnglish ? "Edit profile" : "Profili düzenle",
    editProfileAccessLabel: isEnglish ? "Open profile settings" : "Profil ayarlarını aç",
    heroLabel: isEnglish ? "Club overview" : "Kulüp özeti",
    noTeam: isEnglish ? "No team selected" : "Takım seçilmedi",
    activeMember: isEnglish ? "Active members" : "Aktif üye",
    team: isEnglish ? "Teams" : "Takım",
    event: isEnglish ? "Events" : "Etkinlik",
    athlete: isEnglish ? "Athletes" : "Sporcu",
    announcement: isEnglish ? "Announcements" : "Duyuru",
    approval: isEnglish ? "Approvals" : "Onay",
    accessOpen: isEnglish ? "Access open" : "Erişim açık",
    registered: isEnglish ? "Registered" : "Kayıtlı",
    organized: isEnglish ? "Organized" : "Organize",
    calendar: isEnglish ? "Calendar" : "Takvim",
    published: isEnglish ? "Published" : "Yayın",
    pending: isEnglish ? "Pending" : "Bekleyen",
    pendingMembers: isEnglish ? "Pending memberships" : "Bekleyen üyelik",
    openPayments: isEnglish ? "Open payments" : "Açık ödeme",
    upcomingEvents: isEnglish ? "Upcoming events" : "Yaklaşan etkinlik",
    currentRecord: isEnglish ? "Current record" : "Güncel kayıt",
    quickActionsTitle: isEnglish ? "Priority actions" : "Öncelikli işlemler",
    quickActionsSubtitle: isEnglish ? "The most important screens for managing your club." : "Kulübü yönetmek için en önemli ekranlar.",
    todaySummaryTitle: isEnglish ? "Today’s summary" : "Bugünün özeti",
    todaySummarySubtitle: isEnglish ? "Items that need quick attention." : "Hızlı takip edilmesi gereken başlıklar.",
    noEvents: isEnglish ? "No upcoming events yet." : "Henüz etkinlik yok.",
    clubSummaryTitle: isEnglish ? "Club summary" : "Kulüp özeti",
    clubSummarySubtitle: isEnglish ? "Workspace and club details." : "Çalışma alanı ve kulüp bilgileri.",
    club: isEnglish ? "Club" : "Kulüp",
    city: isEnglish ? "City" : "Şehir",
    clubCode: isEnglish ? "Club code" : "Kulüp kodu",
    operationStatus: isEnglish ? "Operational status" : "Operasyon durumu",
    steady: isEnglish ? "On track" : "Düzenli",
    needsAttention: isEnglish ? "Needs attention" : "Takip gerekli",
    open: isEnglish ? "Open" : "Aç",
    roleHeroText: {
      superAdmin: {
        title: isEnglish ? "Platform operations center" : "Platform operasyon merkezi",
        subtitle: isEnglish ? "Monitor clubs, users, and platform activity from one executive view." : "Kulüp ağını, kullanıcı akışını ve sistem durumunu tek yönetici ekranından takip et.",
      },
      clubAdmin: {
        title: isEnglish ? "Club operations center" : "Kulüp operasyon merkezi",
        subtitle: isEnglish ? "Manage teams, members, schedules, communication, and payments with a clean professional workflow." : "Takımlar, üyeler, program, iletişim ve ödemeler için profesyonel kontrol alanı.",
      },
      coach: {
        title: isEnglish ? "Team operations dashboard" : "Takım operasyon paneli",
        subtitle: isEnglish ? "Manage schedule, attendance, availability, and team communication from one place." : "Program, yoklama, uygunluk ve takım iletişimini tek yerden yönet.",
      },
      parent: {
        title: isEnglish ? "Team family dashboard" : "Takım takip paneli",
        subtitle: isEnglish ? "Follow schedule, announcements, messages, and payment updates for your athlete." : "Program, duyuru, mesaj ve ödeme bilgilerini düzenli şekilde takip et.",
      },
      athlete: {
        title: isEnglish ? "Team schedule dashboard" : "Takım program paneli",
        subtitle: isEnglish ? "Access practices, matches, announcements, messages, and shared content in one place." : "Antrenman, maç, duyuru, mesaj ve paylaşılan içeriklere tek ekrandan ulaş.",
      },
    } satisfies Record<UserRole, { title: string; subtitle: string }>,
    quickActionsByRole: {
      superAdmin: [
        { title: isEnglish ? "Club dashboard" : "Kulüp paneli", meta: isEnglish ? "Review club workspace" : "Kulüp verilerini görüntüle", route: "/dashboard" },
        { title: isEnglish ? "View statistics" : "İstatistikleri gör", meta: isEnglish ? "Platform and club summary" : "Platform ve kulüp özeti", route: "/statistics" },
        { title: isEnglish ? "Account center" : "Hesap merkezi", meta: isEnglish ? "Open profile settings" : "Profil ayarlarını aç", route: "/profile" },
      ],
      clubAdmin: [
        { title: isEnglish ? "Manage teams" : "Takımları yönet", meta: isEnglish ? "Teams and rosters" : "Takım listesi ve kadrolar", route: "/teams" },
        { title: isEnglish ? "Pending approvals" : "Bekleyen onaylar", meta: isEnglish ? "Approve new members" : "Yeni üyeleri onayla", route: "/pending-approvals" },
        { title: isEnglish ? "Publish announcement" : "Duyuru yayınla", meta: isEnglish ? "Club and team updates" : "Kulüp ve takım duyuruları", route: "/announcements" },
        { title: isEnglish ? "Create schedule" : "Program oluştur", meta: isEnglish ? "Practices and matches" : "Antrenman ve maç takvimi", route: "/schedule" },
        { title: isEnglish ? "Open messages" : "Mesajları aç", meta: isEnglish ? "Team and direct chats" : "Takım ve bireysel mesajlar", route: "/messages" },
        { title: isEnglish ? "Review payments" : "Ödemeleri kontrol et", meta: isEnglish ? "Membership payment tracking" : "Aidat ve ödeme takibi", route: "/payments" },
      ],
      coach: [
        { title: isEnglish ? "Manage schedule" : "Programı yönet", meta: isEnglish ? "Add practice or match" : "Antrenman / maç ekle", route: "/schedule" },
        { title: isEnglish ? "Take attendance" : "Yoklama al", meta: isEnglish ? "Mark attendance status" : "Katılım durumlarını işaretle", route: "/attendance" },
        { title: isEnglish ? "Availability" : "Uygunluk cevapları", meta: isEnglish ? "Plan participation" : "Katılım planlamasını gör", route: "/availability" },
        { title: isEnglish ? "Team announcement" : "Takım duyurusu", meta: isEnglish ? "Open announcements" : "Duyuru ekranına git", route: "/announcements" },
        { title: isEnglish ? "Open messages" : "Mesajları aç", meta: isEnglish ? "Team communication" : "Takım iletişimi", route: "/messages" },
        { title: isEnglish ? "Share replay" : "Video / drill paylaş", meta: isEnglish ? "Video and drill content" : "İçerik ekranına git", route: "/replays" },
      ],
      parent: [
        { title: isEnglish ? "View schedule" : "Programı görüntüle", meta: isEnglish ? "Practices and matches" : "Antrenman ve maç takvimi", route: "/schedule" },
        { title: isEnglish ? "Read announcements" : "Duyuruları oku", meta: isEnglish ? "Club and team updates" : "Kulüp ve takım duyuruları", route: "/announcements" },
        { title: isEnglish ? "Send message" : "Mesaj gönder", meta: isEnglish ? "Team communication" : "Takım iletişim ekranı", route: "/messages" },
        { title: isEnglish ? "Set availability" : "Uygunluk bildir", meta: isEnglish ? "Submit participation status" : "Katılım durumunu gönder", route: "/availability" },
        { title: isEnglish ? "Check payments" : "Ödeme durumunu kontrol et", meta: isEnglish ? "Monthly payment details" : "Aylık ödeme bilgileri", route: "/payments" },
      ],
      athlete: [
        { title: isEnglish ? "View my schedule" : "Programımı görüntüle", meta: isEnglish ? "Practices and matches" : "Antrenman ve maç takvimi", route: "/schedule" },
        { title: isEnglish ? "Set availability" : "Uygunluk bildir", meta: isEnglish ? "Submit participation status" : "Katılım durumunu gönder", route: "/availability" },
        { title: isEnglish ? "Read announcements" : "Duyuruları oku", meta: isEnglish ? "Team updates" : "Takım duyurularını gör", route: "/announcements" },
        { title: isEnglish ? "Send message" : "Mesaj gönder", meta: isEnglish ? "Team communication" : "Takım iletişim ekranı", route: "/messages" },
        { title: isEnglish ? "Watch replay" : "Video / drill izle", meta: isEnglish ? "Shared content" : "Paylaşılan içerikler", route: "/replays" },
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
          setStatusMessage(copy.loading);
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
    }, [copy.connectionIssue, copy.loading, copy.ready])
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
  const upcomingEvents = useMemo(() => getUpcomingEvents(scheduleEvents), [scheduleEvents]);
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
            <Text style={styles.welcome}>{copy.welcome}, {getFirstName(currentUser.fullName, copy.userFallback)}</Text>
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
          </View>
          <View style={styles.workspaceCard}>
            <Text style={styles.workspaceLabel}>{copy.clubCode}</Text>
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
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>{copy.quickActionsTitle}</Text>
                <Text style={styles.panelSubtitle}>{copy.quickActionsSubtitle}</Text>
              </View>
            </View>
            <View style={styles.actionGrid}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.title}
                  onPress={() => router.push(action.route as never)}
                  style={({ pressed }) => [styles.actionCard, pressed ? styles.cardPressed : null]}
                >
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
            <Text style={styles.panelTitle}>{copy.todaySummaryTitle}</Text>
            <Text style={styles.panelSubtitle}>{copy.todaySummarySubtitle}</Text>
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
                upcomingEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>{formatEventTime(event.startsAt, locale)}</Text>
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{copy.clubSummaryTitle}</Text>
          <Text style={styles.panelSubtitle}>{copy.clubSummarySubtitle}</Text>
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
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    gap: theme.spacing.xl,
  },
  loadingCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing["3xl"],
    ...theme.shadows.md,
  },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  loadingTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.md,
  },
  topBar: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  topBarSub: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  systemBadge: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  systemDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.state.success,
  },
  systemBadgeText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  pageHeader: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing["2xl"],
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.xl,
  },
  pageTitleArea: {
    flex: 1,
  },
  pageEyebrow: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  welcome: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.sm,
  },
  editProfileButton: {
    alignSelf: "flex-start",
  },
  executiveHero: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },
  heroMainContent: {
    flex: 1,
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
  },
  heroLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    opacity: 0.86,
    marginBottom: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
  },
  heroSubtitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    marginTop: theme.spacing.md,
    opacity: 0.9,
  },
  workspaceCard: {
    width: 260,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  workspaceLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  workspaceCode: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.sm,
  },
  workspaceTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
  },
  statHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  mainGrid: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },
  panel: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  panelTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  panelSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  actionTextArea: {
    flex: 1,
  },
  actionText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  actionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  actionOpenText: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  attentionList: {
    gap: theme.spacing.sm,
  },
  attentionRow: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.subtle,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  attentionLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  attentionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  attentionValue: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  attentionWarning: {
    color: theme.colors.text.warning,
  },
  attentionSuccess: {
    color: theme.colors.text.success,
  },
  eventBlock: {
    gap: theme.spacing.sm,
  },
  blockTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  eventCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  eventTime: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  eventLocation: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: 180,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.subtle,
    padding: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginTop: theme.spacing.xs,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
