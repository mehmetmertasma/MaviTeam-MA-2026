import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type UserRole = "admin" | "coach" | "parent" | "athlete";

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
  | "/payments";

type ProfileData = {
  name: string;
  email: string;
  club: string;
  team: string;
  role: string;
  season: string;
  membership: string;
};

type RoleOption = {
  id: UserRole;
  title: string;
  tag: string;
  description: string;
};

type QuickAction = {
  title: string;
  meta: string;
  route?: AppRoute;
};

type DashboardData = {
  welcomeTitle: string;
  clubSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: {
    label: string;
    value: string;
  }[];
  actions: QuickAction[];
  overview: {
    label: string;
    value: string;
  }[];
};

const PROFILE_STORAGE_KEY = "teamsync_profile_data";

const startingProfileData: ProfileData = {
  name: "Mert Asma",
  email: "mertasma7580@gmail.com",
  club: "İstanbul Voleybol Kulübü",
  team: "U16 Erkek",
  role: "Kulüp yöneticisi",
  season: "2026 Bahar",
  membership: "Kulüp öder, veli/sporcu ücretsiz",
};

const roleOptions: RoleOption[] = [
  {
    id: "admin",
    title: "Kulüp Yöneticisi",
    tag: "Admin",
    description: "Kulübü, takımları, üyeleri ve ödemeleri yönetir.",
  },
  {
    id: "coach",
    title: "Koç",
    tag: "Coach",
    description: "Antrenmanları planlar, yoklama alır ve takımı takip eder.",
  },
  {
    id: "parent",
    title: "Veli",
    tag: "Parent",
    description: "Çocuğunun programını, duyurularını ve ödemelerini takip eder.",
  },
  {
    id: "athlete",
    title: "Sporcu",
    tag: "Athlete",
    description: "Kendi programını görür ve uygunluk durumunu bildirir.",
  },
];

const dashboardData: Record<UserRole, DashboardData> = {
  admin: {
    welcomeTitle: "Hoş geldin, Mert",
    clubSubtitle: "İstanbul Voleybol Kulübü",
    heroTitle: "Kulüp yönetim paneli",
    heroSubtitle:
      "Üyeleri, takımları, duyuruları, programları, ödemeleri ve mesajları tek yerden yönet.",
    stats: [
      { label: "Sporcu", value: "128" },
      { label: "Takım", value: "7" },
      { label: "Bekleyen onay", value: "12" },
      { label: "Etkinlik", value: "24" },
    ],
    actions: [
      { title: "Takımları yönet", meta: "Takım listesi ve kadrolar", route: "/teams" },
      { title: "Bekleyen onaylar", meta: "Yeni üyeleri onayla", route: "/pending-approvals" },
      { title: "Duyuru yayınla", meta: "Kulüp ve takım duyuruları", route: "/announcements" },
      { title: "Mesajları aç", meta: "Takım ve bireysel mesajlar", route: "/messages" },
      { title: "Program oluştur", meta: "Antrenman ve maç takvimi", route: "/schedule" },
      { title: "Yoklama yönet", meta: "Katılım durumları", route: "/attendance" },
      { title: "Ödemeleri kontrol et", meta: "Aidat ve ödeme takibi", route: "/payments" },
      { title: "İstatistikleri gör", meta: "Performans ve kulüp özeti", route: "/statistics" },
    ],
    overview: [
      { label: "Aktif sezon", value: "2026 Bahar" },
      { label: "Rolün", value: "Kulüp yöneticisi" },
      { label: "Davet kodu", value: "TS-2026" },
      { label: "Üyelik modeli", value: "Kulüp öder, veli/sporcu ücretsiz" },
    ],
  },
  coach: {
    welcomeTitle: "Koç paneli",
    clubSubtitle: "U17 Erkek · İstanbul Voleybol Kulübü",
    heroTitle: "Takımını yönet",
    heroSubtitle:
      "Antrenman planlarını, oyuncu katılımını, uygunluk cevaplarını ve mesajları hızlıca takip et.",
    stats: [
      { label: "Oyuncu", value: "18" },
      { label: "Bu hafta", value: "4" },
      { label: "Yaklaşan maç", value: "2" },
      { label: "Cevap bekleyen", value: "3" },
    ],
    actions: [
      { title: "Programı yönet", meta: "Antrenman / maç ekle", route: "/schedule" },
      { title: "Yoklama al", meta: "Katılım durumlarını işaretle", route: "/attendance" },
      { title: "Uygunluk cevapları", meta: "Kim geliyor, kim gelmiyor?", route: "/availability" },
      { title: "Takım duyurusu", meta: "Duyuru ekranına git", route: "/announcements" },
      { title: "Mesajları aç", meta: "Veli ve sporcularla iletişim", route: "/messages" },
      { title: "Video / drill paylaş", meta: "Replays ekranına git", route: "/replays" },
    ],
    overview: [
      { label: "Takım", value: "U17 Erkek" },
      { label: "Rolün", value: "Koç" },
      { label: "Sıradaki antrenman", value: "Bugün 18:30" },
      { label: "Katılım takibi", value: "Açık" },
    ],
  },
  parent: {
    welcomeTitle: "Veli paneli",
    clubSubtitle: "Efe Asma · İstanbul Voleybol Kulübü",
    heroTitle: "Çocuğunun takım sürecini takip et",
    heroSubtitle:
      "Antrenman saatlerini, maç programını, duyuruları, mesajları ve ödeme durumunu tek yerden gör.",
    stats: [
      { label: "Antrenman", value: "3" },
      { label: "Maç", value: "1" },
      { label: "Duyuru", value: "2" },
      { label: "Ödeme", value: "OK" },
    ],
    actions: [
      { title: "Programı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
      { title: "Duyuruları oku", meta: "Kulüp ve takım duyuruları", route: "/announcements" },
      { title: "Koça mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
      { title: "Uygunluk bildir", meta: "Çocuğun için katılım bildir", route: "/availability" },
      { title: "Ödeme durumunu kontrol et", meta: "Aylık ödeme bilgileri", route: "/payments" },
      { title: "İstatistikleri gör", meta: "Katılım ve performans özeti", route: "/statistics" },
    ],
    overview: [
      { label: "Sporcu", value: "Efe Asma" },
      { label: "Rolün", value: "Veli" },
      { label: "Takım", value: "U17 Erkek" },
      { label: "Ödeme", value: "Haziran ödendi" },
    ],
  },
  athlete: {
    welcomeTitle: "Sporcu paneli",
    clubSubtitle: "U17 Erkek · İstanbul Voleybol Kulübü",
    heroTitle: "Kendi takım programını takip et",
    heroSubtitle:
      "Antrenmanlarını, maçlarını, duyuruları ve takım mesajlarını gör. Uygunluk durumunu koçuna bildir.",
    stats: [
      { label: "Antrenman", value: "3" },
      { label: "Maç", value: "1" },
      { label: "Duyuru", value: "2" },
      { label: "Uygunluk", value: "✓" },
    ],
    actions: [
      { title: "Programımı görüntüle", meta: "Antrenman ve maç takvimi", route: "/schedule" },
      { title: "Uygunluk bildir", meta: "Geliyorum / gelemiyorum", route: "/availability" },
      { title: "Duyuruları oku", meta: "Takım duyurularını gör", route: "/announcements" },
      { title: "Koça mesaj gönder", meta: "Takım iletişim ekranı", route: "/messages" },
      { title: "Video / drill izle", meta: "Koçun paylaştığı içerikler", route: "/replays" },
      { title: "İstatistiklerimi gör", meta: "Katılım ve performans özeti", route: "/statistics" },
    ],
    overview: [
      { label: "Sporcu", value: "Mert Asma" },
      { label: "Rolün", value: "Sporcu" },
      { label: "Takım", value: "U17 Erkek" },
      { label: "Sıradaki etkinlik", value: "Bugün 18:30 antrenman" },
    ],
  },
};

const upcomingEvents = [
  {
    title: "U17 Erkek antrenmanı",
    time: "Bugün, 18:30",
    location: "Burhan Felek Spor Salonu",
  },
  {
    title: "Hazırlık maçı",
    time: "Yarın, 20:00",
    location: "Kadıköy Spor Kompleksi",
  },
  {
    title: "Veli bilgilendirme toplantısı",
    time: "Cuma, 19:00",
    location: "Kulüp Toplantı Salonu",
  },
];

function getFirstName(name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Kullanıcı";
  }

  return trimmedName.split(" ")[0];
}

export default function DashboardScreen() {
  const [activeRole, setActiveRole] = useState<UserRole>("admin");
  const [savedProfileData, setSavedProfileData] =
    useState<ProfileData>(startingProfileData);

  const currentDashboard = dashboardData[activeRole];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSavedProfile() {
        try {
          const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

          if (savedProfile === null) {
            return;
          }

          const parsedProfile = JSON.parse(savedProfile) as ProfileData;

          if (isActive) {
            setSavedProfileData(parsedProfile);
          }
        } catch {
          if (isActive) {
            setSavedProfileData(startingProfileData);
          }
        }
      }

      loadSavedProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const dashboardWelcome =
    activeRole === "admin" || activeRole === "athlete"
      ? `Hoş geldin, ${getFirstName(savedProfileData.name)}`
      : currentDashboard.welcomeTitle;

  const dashboardSubtitle =
    activeRole === "admin" ? savedProfileData.club : currentDashboard.clubSubtitle;

  const overviewItems = currentDashboard.overview.map((item) => {
    if (item.label === "Aktif sezon") {
      return { ...item, value: savedProfileData.season };
    }

    if (item.label === "Rolün" && activeRole === "admin") {
      return { ...item, value: savedProfileData.role };
    }

    if (item.label === "Takım") {
      return { ...item, value: savedProfileData.team };
    }

    if (item.label === "Üyelik modeli") {
      return { ...item, value: savedProfileData.membership };
    }

    if (item.label === "Sporcu" && activeRole === "athlete") {
      return { ...item, value: savedProfileData.name };
    }

    return item;
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.welcome}>{dashboardWelcome}</Text>
          <Text style={styles.subtitle}>{dashboardSubtitle}</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Rol bazlı kontrol paneli</Text>
          <Text style={styles.heroTitle}>{currentDashboard.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{currentDashboard.heroSubtitle}</Text>

          <AppButton
            title="Profili düzenle"
            variant="secondary"
            accessibilityLabel="Profil düzenleme sayfasına git"
            style={styles.editProfileButton}
            onPress={() => router.push("/profile" as never)}
          />
        </View>

        <View style={styles.statsGrid}>
          {currentDashboard.stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rol seçimi</Text>
          <Text style={styles.sectionSubtitle}>
            Şimdilik gerçek giriş sistemi yok. Bu bölümle farklı kullanıcı rollerinin dashboard’da nasıl görüneceğini test ediyoruz.
          </Text>

          <View style={styles.roleGrid}>
            {roleOptions.map((role) => {
              const isActive = activeRole === role.id;

              return (
                <Pressable
                  key={role.id}
                  onPress={() => setActiveRole(role.id)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    isActive ? styles.roleCardActive : null,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <View style={styles.roleHeader}>
                    <Text style={[styles.roleTitle, isActive ? styles.roleTitleActive : null]}>
                      {role.title}
                    </Text>
                    <Text style={[styles.roleTag, isActive ? styles.roleTagActive : null]}>
                      {role.tag}
                    </Text>
                  </View>

                  <Text style={[styles.roleDescription, isActive ? styles.roleDescriptionActive : null]}>
                    {role.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı işlemler</Text>

          <View style={styles.actionGrid}>
            {currentDashboard.actions.map((action) => {
              return (
                <Pressable
                  key={action.title}
                  onPress={() => {
                    if (action.route !== undefined) {
                      router.push(action.route as never);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed ? styles.cardPressed : null,
                  ]}
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

          <View style={styles.eventList}>
            {upcomingEvents.map((event) => (
              <View key={event.title} style={styles.eventCard}>
                <View style={styles.eventDot} />

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kulüp özeti</Text>

          {overviewItems.map((item, index) => {
            const isLastItem = index === overviewItems.length - 1;

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
  roleGrid: {
    gap: theme.spacing.md,
  },
  roleCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  roleCardActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  roleTitle: {
    flex: 1,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  roleTitleActive: {
    color: theme.colors.text.inverse,
  },
  roleTag: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  roleTagActive: {
    backgroundColor: theme.colors.background.surface,
  },
  roleDescription: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  roleDescriptionActive: {
    color: theme.colors.text.inverse,
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  actionTextArea: {
    flex: 1,
  },
  actionText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  actionArrow: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  eventList: {
    gap: theme.spacing.md,
  },
  eventCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    marginTop: theme.spacing.sm,
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
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  infoLabel: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
