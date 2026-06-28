import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { ScheduleEvent, TeamSyncAppData, UserRole } from "@/types/teamSync";

type AppRoute =
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

const roleDisplayNames: Record<UserRole, string> = {
  superAdmin: "Platform yöneticisi",
  clubAdmin: "Kulüp yöneticisi",
  coach: "Koç",
  parent: "Veli",
  athlete: "Sporcu",
};

const roleHeroText: Record<UserRole, { title: string; subtitle: string }> = {
  superAdmin: {
    title: "Platform kontrol merkezi",
    subtitle: "Kulüpleri, kullanıcıları ve TeamSync sistemini merkezi data üzerinden takip et.",
  },
  clubAdmin: {
    title: "Kulüp yönetim paneli",
    subtitle: "Kulübünü, takımlarını, üyelerini, duyurularını, programını ve ödemelerini tek yerden yönet.",
  },
  coach: {
    title: "Takımını yönet",
    subtitle: "Antrenman planlarını, yoklamayı, uygunluk cevaplarını ve takım mesajlarını takip et.",
  },
  parent: {
    title: "Çocuğunun takım sürecini takip et",
    subtitle: "Programı, duyuruları, mesajları ve ödeme durumunu tek yerden gör.",
  },
  athlete: {
    title: "Kendi takım programını takip et",
    subtitle: "Antrenmanlarını, maçlarını, duyuruları ve takım mesajlarını gör.",
  },
};

const quickActionsByRole: Record<UserRole, QuickAction[]> = {
  superAdmin: [
    { title: "Kulüp paneli", meta: "Kulüp verilerini görüntüle", route: "/dashboard" as AppRoute },
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
    { title: "Uygunluk cevapları", meta: "Kim geliyor, kim gelmiyor?", route: "/availability" },
    { title: "Takım duyurusu", meta: "Duyuru ekranına git", route: "/announcements" },
    { title: "Mesajları aç", meta: "Veli ve sporcularla iletişim", route: "/messages" },
    { title: "Video / drill paylaş", meta: "Replays ekranına git", route: "/replays" },
  ],
  parent: [
    { title: "Programı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
    { title: "Duyuruları oku", meta: "Kulüp ve takım duyuruları", route: "/announcements" },
    { title: "Koça mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
    { title: "Uygunluk bildir", meta: "Çocuğun için katılım bildir", route: "/availability" },
    { title: "Ödeme durumunu kontrol et", meta: "Aylık ödeme bilgileri", route: "/payments" },
  ],
  athlete: [
    { title: "Programımı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
    { title: "Uygunluk bildir", meta: "Geliyorum / gelemiyorum", route: "/availability" },
    { title: "Duyuruları oku", meta: "Takım duyurularını gör", route: "/announcements" },
    { title: "Koça mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
    { title: "Video / drill izle", meta: "Koçun paylaştığı içerikler", route: "/replays" },
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
  const [statusMessage, setStatusMessage] = useState("Merkezi data yükleniyor...");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadDashboardData() {
        try {
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
            setStatusMessage("Dashboard merkezi TeamSync datasından yüklendi.");
          }
        } catch {
          if (isActive) {
            setAppData(null);
            setStatusMessage("Dashboard datası yüklenirken bir sorun oluştu.");
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
      stats: [
        { label: "Aktif üye", value: String(activeUsers.length) },
        { label: "Sporcu", value: String(athleteCount) },
        { label: "Takım", value: String(teams.length) },
        { label: "Etkinlik", value: String(scheduleEvents.length) },
        { label: "Duyuru", value: String(announcements.length) },
        { label: "Bekleyen onay", value: String(pendingRequestCount) },
      ],
      overview: [
        { label: "Kulüp", value: club.name },
        { label: "Rolün", value: roleDisplayNames[currentUser.role] },
        { label: "Takım", value: primaryTeam?.name ?? "Takım seçilmedi" },
        { label: "Kulüp kodu", value: club.code },
        { label: "Şehir", value: club.city },
        { label: "Ödeme kontrol", value: unpaidPaymentCount === 0 ? "Sorun yok" : `${unpaidPaymentCount} açık ödeme` },
        { label: "Data modu", value: "AsyncStorage service layer" },
      ],
    };
  }, [appData]);

  if (dashboardModel === null) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
        <View style={styles.container}>
          <View style={styles.pageHeader}>
            <Text style={styles.logo}>TeamSync</Text>
            <Text style={styles.welcome}>Dashboard</Text>
            <Text style={styles.subtitle}>{statusMessage}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.welcome}>Hoş geldin, {getFirstName(dashboardModel.currentUser.fullName)}</Text>
          <Text style={styles.subtitle}>{dashboardModel.club.name}</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Merkezi data paneli</Text>
          <Text style={styles.heroTitle}>{dashboardModel.heroText.title}</Text>
          <Text style={styles.heroSubtitle}>{dashboardModel.heroText.subtitle}</Text>
          <Text style={styles.statusText}>{statusMessage}</Text>

          <AppButton
            title="Profili düzenle"
            variant="secondary"
            accessibilityLabel="Profil düzenleme sayfasına git"
            style={styles.editProfileButton}
            onPress={() => router.push("/profile" as never)}
          />
        </View>

        <View style={styles.statsGrid}>
          {dashboardModel.stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı işlemler</Text>
          <Text style={styles.sectionSubtitle}>
            Bu butonlar kullanıcının gerçek rolüne göre merkezi datadan gelen role bilgisiyle gösteriliyor.
          </Text>

          <View style={styles.actionGrid}>
            {dashboardModel.quickActions.map((action) => {
              return (
                <Pressable
                  key={action.title}
                  onPress={() => router.push(action.route as never)}
                  style={({ pressed }) => [styles.actionCard, pressed ? styles.cardPressed : null]}
                >
                  <View style={styles.actionTextArea}>
                    <Text style={styles.actionText}>{action.title}</Text>
                    <Text style={styles.actionMeta}>{action.meta}</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan etkinlikler</Text>

          {dashboardModel.upcomingEvents.length === 0 ? (
            <Text style={styles.emptyText}>Henüz etkinlik yok.</Text>
          ) : (
            <View style={styles.eventList}>
              {dashboardModel.upcomingEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventDot} />

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kulüp özeti</Text>

          {dashboardModel.overview.map((item, index) => {
            const isLastItem = index === dashboardModel.overview.length - 1;

            return (
              <View key={item.label} style={isLastItem ? styles.infoRowLast : styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            );
          })}
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
    maxWidth: 980,
    alignSelf: "center",
  },
  pageHeader: {
    marginBottom: theme.spacing["2xl"],
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.md,
  },
  welcome: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontWeight: theme.fontWeights.semibold,
  },
  heroCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
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
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  statusText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.success,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  editProfileButton: {
    marginTop: theme.spacing["2xl"],
    alignSelf: "flex-start",
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
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.xl,
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actionTextArea: {
    flex: 1,
  },
  actionText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  actionArrow: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
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
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    marginTop: theme.spacing.xs,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  eventTime: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  infoRowLast: {
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
});
