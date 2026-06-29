import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
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

const roleHeroText: Record<UserRole, { title: string; subtitle: string }> = {
  superAdmin: {
    title: "Platform operasyon merkezi",
    subtitle: "Kulüp ağını, kullanıcı akışını ve sistem durumunu tek panelden takip et.",
  },
  clubAdmin: {
    title: "Kulüp operasyon merkezi",
    subtitle: "Takımlar, üyeler, program, iletişim ve ödemeler için profesyonel kontrol alanı.",
  },
  coach: {
    title: "Takım operasyon paneli",
    subtitle: "Program, yoklama, uygunluk ve takım iletişimini hızlıca yönet.",
  },
  parent: {
    title: "Takım takip paneli",
    subtitle: "Program, duyuru, mesaj ve ödeme bilgilerini düzenli şekilde takip et.",
  },
  athlete: {
    title: "Takım program paneli",
    subtitle: "Antrenman, maç, duyuru ve paylaşılan içeriklere tek ekrandan ulaş.",
  },
};

const quickActionsByRole: Record<UserRole, QuickAction[]> = {
  superAdmin: [
    { title: "Kulüp paneli", meta: "Kulüp verilerini görüntüle", route: "/dashboard" },
    { title: "İstatistikleri gör", meta: "Platform ve kulüp özeti", route: "/statistics" },
    { title: "Profil bilgileri", meta: "Hesap merkezine git", route: "/profile" },
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

function getFirstName(name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Kullanıcı";
  }

  return trimmedName.split(" ")[0];
}

function formatEventTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUpcomingEvents(events: ScheduleEvent[]) {
  return [...events]
    .sort((firstEvent, secondEvent) => {
      return new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime();
    })
    .slice(0, 3);
}

export default function DashboardScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [statusMessage, setStatusMessage] = useState("Yükleniyor");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDashboardData() {
        try {
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
            setStatusMessage("Sistem hazır");
          }
        } catch {
          if (isActive) {
            setAppData(null);
            setStatusMessage("Veri bağlantısı kontrol edilmeli");
          }
        }
      }

      loadDashboardData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const dashboardModel = useMemo(() => {
    if (appData === null) {
      return null;
    }

    const { club, currentUser, users, teams, announcements, scheduleEvents, payments, joinRequests } = appData;
    const activeUsers = users.filter((user) => user.status === "active");
    const athleteCount = activeUsers.filter((user) => user.role === "athlete").length;
    const pendingRequestCount = joinRequests.filter((request) => request.status === "pending").length;
    const unpaidPaymentCount = payments.filter((payment) => payment.status !== "paid").length;
    const primaryTeam = teams.find((team) => currentUser.teamIds.includes(team.id));
    const heroText = roleHeroText[currentUser.role];

    return {
      club,
      currentUser,
      primaryTeam,
      heroText,
      quickActions: quickActionsByRole[currentUser.role],
      upcomingEvents: getUpcomingEvents(scheduleEvents),
      heroMetrics: [
        { label: "Aktif üye", value: String(activeUsers.length) },
        { label: "Takım", value: String(teams.length) },
        { label: "Etkinlik", value: String(scheduleEvents.length) },
      ],
      stats: [
        { label: "Aktif üye", value: String(activeUsers.length), hint: "Erişim açık" },
        { label: "Oyuncu", value: String(athleteCount), hint: "Kayıtlı" },
        { label: "Takım", value: String(teams.length), hint: "Organize" },
        { label: "Etkinlik", value: String(scheduleEvents.length), hint: "Takvim" },
        { label: "Duyuru", value: String(announcements.length), hint: "Yayın" },
        { label: "Onay", value: String(pendingRequestCount), hint: "Bekleyen" },
      ],
      attentionItems: [
        { label: "Bekleyen üyelik", value: String(pendingRequestCount), tone: pendingRequestCount > 0 ? "warning" : "success" },
        { label: "Açık ödeme", value: String(unpaidPaymentCount), tone: unpaidPaymentCount > 0 ? "warning" : "success" },
        { label: "Yaklaşan etkinlik", value: String(Math.min(scheduleEvents.length, 3)), tone: "info" },
      ],
      overview: [
        { label: "Kulüp", value: club.name },
        { label: "Takım", value: primaryTeam?.name ?? "Takım seçilmedi" },
        { label: "Kulüp kodu", value: club.code },
        { label: "Şehir", value: club.city },
        { label: "Operasyon durumu", value: unpaidPaymentCount === 0 && pendingRequestCount === 0 ? "Düzenli" : "Takip gerekli" },
      ],
    };
  }, [appData]);

  if (dashboardModel === null) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
        <View style={styles.container}>
          <View style={styles.loadingCard}>
            <Text style={styles.logo}>TeamSync</Text>
            <Text style={styles.loadingTitle}>Operasyon paneli</Text>
            <Text style={styles.loadingText}>{statusMessage}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.logo}>TeamSync</Text>
            <Text style={styles.topBarSub}>Kulüp yönetim sistemi</Text>
          </View>
          <View style={styles.systemBadge}>
            <View style={styles.systemDot} />
            <Text style={styles.systemBadgeText}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.pageTitleArea}>
            <Text style={styles.pageEyebrow}>Operasyon paneli</Text>
            <Text style={styles.welcome}>Hoş geldin, {getFirstName(dashboardModel.currentUser.fullName)}</Text>
            <Text style={styles.subtitle}>{dashboardModel.club.name}</Text>
          </View>

          <AppButton
            title="Profili düzenle"
            variant="secondary"
            accessibilityLabel="Profil düzenleme sayfasına git"
            style={styles.editProfileButton}
            onPress={() => router.push("/profile" as never)}
          />
        </View>

        <View style={styles.executiveHero}>
          <View style={styles.heroMainContent}>
            <Text style={styles.heroLabel}>Management overview</Text>
            <Text style={styles.heroTitle}>{dashboardModel.heroText.title}</Text>
            <Text style={styles.heroSubtitle}>{dashboardModel.heroText.subtitle}</Text>

            <View style={styles.heroMetricRow}>
              {dashboardModel.heroMetrics.map((metric) => (
                <View key={metric.label} style={styles.heroMetricCard}>
                  <Text style={styles.heroMetricValue}>{metric.value}</Text>
                  <Text style={styles.heroMetricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.workspaceCard}>
            <Text style={styles.workspaceLabel}>Workspace</Text>
            <Text style={styles.workspaceName}>{dashboardModel.club.name}</Text>
            <View style={styles.workspaceDivider} />
            <Text style={styles.workspaceMetaLabel}>Kulüp kodu</Text>
            <Text style={styles.workspaceCode}>{dashboardModel.club.code}</Text>
            <Text style={styles.workspaceTeam}>{dashboardModel.primaryTeam?.name ?? "Takım seçilmedi"}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {dashboardModel.stats.map((stat) => (
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
                <Text style={styles.panelTitle}>Öncelikli işlemler</Text>
                <Text style={styles.panelSubtitle}>En sık kullanılan yönetim ekranları.</Text>
              </View>
              <Text style={styles.panelCount}>{dashboardModel.quickActions.length}</Text>
            </View>

            <View style={styles.actionGrid}>
              {dashboardModel.quickActions.map((action) => {
                return (
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
                    <Text style={styles.actionOpenText}>Aç</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.panel, styles.sidePanel]}>
            <View style={styles.panelHeaderCompact}>
              <Text style={styles.panelTitle}>Bugünün özeti</Text>
              <Text style={styles.panelSubtitle}>Takip edilmesi gereken başlıklar.</Text>
            </View>

            <View style={styles.attentionList}>
              {dashboardModel.attentionItems.map((item) => (
                <View key={item.label} style={styles.attentionRow}>
                  <View>
                    <Text style={styles.attentionLabel}>{item.label}</Text>
                    <Text style={styles.attentionMeta}>Güncel kayıt</Text>
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
              <Text style={styles.blockTitle}>Yaklaşan etkinlikler</Text>
              {dashboardModel.upcomingEvents.length === 0 ? (
                <Text style={styles.emptyText}>Henüz etkinlik yok.</Text>
              ) : (
                <View style={styles.eventList}>
                  {dashboardModel.upcomingEvents.map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                      <View style={styles.eventDateBox}>
                        <Text style={styles.eventDateText}>{formatEventTime(event.startsAt).split(" ")[0]}</Text>
                      </View>

                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventTime}>{formatEventTime(event.startsAt)}</Text>
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
            <Text style={styles.panelTitle}>Kulüp özeti</Text>
            <Text style={styles.panelSubtitle}>Çalışma alanı bilgileri.</Text>
          </View>

          <View style={styles.overviewGrid}>
            {dashboardModel.overview.map((item) => {
              return (
                <View key={item.label} style={styles.infoCard}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              );
            })}
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
