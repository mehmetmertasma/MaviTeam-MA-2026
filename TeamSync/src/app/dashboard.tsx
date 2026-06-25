import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type UserRole = "admin" | "coach" | "parent" | "athlete";

type AppRoute =
  | "/teams"
  | "/pending-approvals"
  | "/announcements"
  | "/schedule"
  | "/attendance";

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

const roleOptions: RoleOption[] = [
  {
    id: "admin",
    title: "Kulüp Yöneticisi",
    tag: "Admin",
    description: "Kulübü, takımları, üyeleri ve davet kodlarını yönetir.",
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
      "Kulübünüzün üyelerini, takımlarını, antrenmanlarını, duyurularını ve davet kodlarını tek yerden yönetin.",
    stats: [
      { label: "Sporcu", value: "128" },
      { label: "Takım", value: "7" },
      { label: "Bekleyen onay", value: "12" },
      { label: "Etkinlik", value: "24" },
    ],
    actions: [
      {
        title: "Yeni takım oluştur",
        meta: "Takım yönetimine git",
        route: "/teams",
      },
      {
        title: "Bekleyen üyeleri onayla",
        meta: "Onay ekranına git",
        route: "/pending-approvals",
      },
      {
        title: "Program oluştur",
        meta: "Takvim ekranına git",
        route: "/schedule",
      },
      {
        title: "Duyuru yayınla",
        meta: "Duyuru ekranına git",
        route: "/announcements",
      },
      {
        title: "Kulüp ayarlarını düzenle",
        meta: "Yakında aktif olacak",
      },
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
    clubSubtitle: "A Takım · İstanbul Voleybol Kulübü",
    heroTitle: "Takımını yönet",
    heroSubtitle:
      "Antrenman planlarını, oyuncu katılımını ve yaklaşan maçları hızlıca takip et.",
    stats: [
      { label: "Oyuncu", value: "18" },
      { label: "Bu hafta antrenman", value: "4" },
      { label: "Yaklaşan maç", value: "2" },
      { label: "Eksik bildiren", value: "3" },
    ],
    actions: [
      {
        title: "Antrenman planla",
        meta: "Takvim ekranına git",
        route: "/schedule",
      },
      {
        title: "Yoklama al",
        meta: "Yoklama ekranına git",
        route: "/attendance",
      },
      {
        title: "Takım duyurusu gönder",
        meta: "Yakında aktif olacak",
      },
      {
        title: "Oyuncu durumlarını kontrol et",
        meta: "Yakında aktif olacak",
      },
    ],
    overview: [
      { label: "Takım", value: "A Takım" },
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
      "Antrenman saatlerini, maç programını, duyuruları ve ödeme durumunu tek yerden gör.",
    stats: [
      { label: "Bu hafta antrenman", value: "3" },
      { label: "Yaklaşan maç", value: "1" },
      { label: "Yeni duyuru", value: "2" },
      { label: "Ödeme durumu", value: "OK" },
    ],
    actions: [
      {
        title: "Programı görüntüle",
        meta: "Takvim ekranına git",
        route: "/schedule",
      },
      {
        title: "Duyuruları oku",
        meta: "Yakında aktif olacak",
      },
      {
        title: "Ödeme durumunu kontrol et",
        meta: "Yakında aktif olacak",
      },
      {
        title: "Koç mesajlarını gör",
        meta: "Yakında aktif olacak",
      },
    ],
    overview: [
      { label: "Sporcu", value: "Efe Asma" },
      { label: "Rolün", value: "Veli" },
      { label: "Takım", value: "U16 Erkek" },
      { label: "Ödeme", value: "Haziran ödendi" },
    ],
  },
  athlete: {
    welcomeTitle: "Sporcu paneli",
    clubSubtitle: "U16 Erkek · İstanbul Voleybol Kulübü",
    heroTitle: "Kendi takım programını takip et",
    heroSubtitle:
      "Antrenmanlarını, maçlarını ve takım duyurularını gör. Uygunluk durumunu koçuna bildir.",
    stats: [
      { label: "Bu hafta antrenman", value: "3" },
      { label: "Yaklaşan maç", value: "1" },
      { label: "Duyuru", value: "2" },
      { label: "Uygunluk", value: "✓" },
    ],
    actions: [
      {
        title: "Uygunum olarak işaretle",
        meta: "Yakında aktif olacak",
      },
      {
        title: "Programımı görüntüle",
        meta: "Takvim ekranına git",
        route: "/schedule",
      },
      {
        title: "Duyuruları oku",
        meta: "Yakında aktif olacak",
      },
      {
        title: "Maç bilgilerini gör",
        meta: "Yakında aktif olacak",
      },
    ],
    overview: [
      { label: "Sporcu", value: "Mert Asma" },
      { label: "Rolün", value: "Sporcu" },
      { label: "Takım", value: "U16 Erkek" },
      { label: "Sıradaki etkinlik", value: "Bugün 18:30 antrenman" },
    ],
  },
};

const upcomingEvents = [
  {
    title: "A Takım antrenmanı",
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

export default function DashboardScreen() {
  const [activeRole, setActiveRole] = useState<UserRole>("admin");

  const currentDashboard = dashboardData[activeRole];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.welcome}>{currentDashboard.welcomeTitle}</Text>
            <Text style={styles.subtitle}>{currentDashboard.clubSubtitle}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Rol bazlı kontrol paneli</Text>

          <Text style={styles.heroTitle}>{currentDashboard.heroTitle}</Text>

          <Text style={styles.heroSubtitle}>
            {currentDashboard.heroSubtitle}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rol seçimi</Text>

          <Text style={styles.sectionSubtitle}>
            Şimdilik gerçek giriş sistemi yok. Bu bölümle farklı kullanıcı
            rollerinin dashboard’da nasıl görüneceğini test ediyoruz.
          </Text>

          <View style={styles.roleGrid}>
            {roleOptions.map((role) => {
              const isActive = activeRole === role.id;

              return (
                <Pressable
                  key={role.id}
                  onPress={() => setActiveRole(role.id)}
                  style={[
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                  ]}
                >
                  <View style={styles.roleHeader}>
                    <Text
                      style={[
                        styles.roleTitle,
                        isActive && styles.roleTitleActive,
                      ]}
                    >
                      {role.title}
                    </Text>

                    <Text
                      style={[
                        styles.roleTag,
                        isActive && styles.roleTagActive,
                      ]}
                    >
                      {role.tag}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.roleDescription,
                      isActive && styles.roleDescriptionActive,
                    ]}
                  >
                    {role.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
          <Text style={styles.sectionTitle}>Hızlı işlemler</Text>

          <View style={styles.actionGrid}>
            {currentDashboard.actions.map((action) => {
              if (action.route !== undefined) {
                return (
                  <Link key={action.title} href={action.route} asChild>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionCard,
                        styles.actionCardClickable,
                        pressed && styles.actionCardPressed,
                      ]}
                    >
                      <Text style={styles.actionText}>{action.title}</Text>
                      <Text style={styles.actionMeta}>{action.meta}</Text>
                    </Pressable>
                  </Link>
                );
              }

              return (
                <View
                  key={action.title}
                  style={[styles.actionCard, styles.actionCardDisabled]}
                >
                  <Text style={styles.actionText}>{action.title}</Text>
                  <Text style={styles.actionMeta}>{action.meta}</Text>
                </View>
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

          {currentDashboard.overview.map((item, index) => {
            const isLastItem = index === currentDashboard.overview.length - 1;

            return (
              <View
                key={item.label}
                style={isLastItem ? styles.infoRowLast : styles.infoRow}
              >
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>

        <Link href="/" asChild>
          <AppButton
            title="Ana sayfaya dön"
            variant="ghost"
            accessibilityLabel="Ana sayfaya dön"
            style={styles.backButton}
          />
        </Link>
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
    padding: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
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
    color: theme.colors.text.brand,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 180,
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
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  actionCardClickable: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primarySoft,
  },
  actionCardDisabled: {
    opacity: 0.72,
  },
  actionCardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
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
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.muted,
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
    paddingVertical: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});