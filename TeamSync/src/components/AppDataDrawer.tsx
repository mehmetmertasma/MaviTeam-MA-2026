import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { authService } from "@/services/authService";
import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData, UserRole } from "@/types/teamSync";

type AppDataDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type DrawerItem = {
  label: string;
  subtitle: string;
  route?: string;
  isDisabled?: boolean;
};

function getDrawerCopy(language: "tr" | "en") {
  if (language === "en") {
    return {
      menuTitle: "Menu",
      userFallback: "MaviTeam User",
      loadingProfile: "Loading profile details",
      noClub: "No club yet",
      soon: "Soon",
      logout: "Log out",
      logoutSubtitle: "End this session securely",
      loggingOut: "Logging out...",
      logoutFailed: "Logout failed. Please try again.",
      roleLabels: {
        superAdmin: "Platform admin",
        clubAdmin: "Club admin",
        coach: "Coach",
        parent: "Parent",
        athlete: "Athlete",
      } satisfies Record<UserRole, string>,
      items: [
        { label: "Dashboard", subtitle: "Club command center", route: "/dashboard" },
        { label: "Messages", subtitle: "Team and direct conversations", route: "/messages" },
        { label: "Announcements", subtitle: "Club and team updates", route: "/announcements" },
        { label: "Schedule", subtitle: "Practices and match calendar", route: "/schedule" },
        { label: "Attendance", subtitle: "Attendance tracking", route: "/attendance" },
        { label: "Availability", subtitle: "Available / unavailable responses", route: "/availability" },
        { label: "Teams", subtitle: "Team management", route: "/teams" },
        { label: "Payments", subtitle: "Payment tracking", route: "/payments" },
        { label: "Statistics", subtitle: "Performance and participation summary", route: "/statistics" },
        { label: "Replays", subtitle: "Video and drill content", route: "/replays" },
        { label: "Profile", subtitle: "Account and club profile", route: "/profile" },
        { label: "Settings", subtitle: "App preferences", isDisabled: true },
      ] satisfies DrawerItem[],
    };
  }

  return {
    menuTitle: "Menü",
    userFallback: "MaviTeam Kullanıcı",
    loadingProfile: "Profil bilgileri yükleniyor",
    noClub: "Kulüp yok",
    soon: "Yakında",
    logout: "Çıkış yap",
    logoutSubtitle: "Bu oturumu güvenli şekilde kapat",
    loggingOut: "Çıkış yapılıyor...",
    logoutFailed: "Çıkış yapılamadı. Lütfen tekrar dene.",
    roleLabels: {
      superAdmin: "Platform yöneticisi",
      clubAdmin: "Kulüp yöneticisi",
      coach: "Koç",
      parent: "Veli",
      athlete: "Sporcu",
    } satisfies Record<UserRole, string>,
    items: [
      { label: "Panel", subtitle: "Kulüp kontrol merkezi", route: "/dashboard" },
      { label: "Mesajlar", subtitle: "Takım ve bireysel mesajlar", route: "/messages" },
      { label: "Duyurular", subtitle: "Kulüp ve takım duyuruları", route: "/announcements" },
      { label: "Program", subtitle: "Antrenman ve maç takvimi", route: "/schedule" },
      { label: "Yoklama", subtitle: "Katılım takibi", route: "/attendance" },
      { label: "Uygunluk", subtitle: "Geliyorum / gelemiyorum bildirimi", route: "/availability" },
      { label: "Takımlar", subtitle: "Takım yönetimi", route: "/teams" },
      { label: "Ödemeler", subtitle: "Ödeme takibi", route: "/payments" },
      { label: "İstatistikler", subtitle: "Performans ve katılım özeti", route: "/statistics" },
      { label: "Videolar", subtitle: "Video ve drill içerikleri", route: "/replays" },
      { label: "Profil", subtitle: "Hesap ve kulüp bilgileri", route: "/profile" },
      { label: "Ayarlar", subtitle: "Uygulama tercihleri", isDisabled: true },
    ] satisfies DrawerItem[],
  };
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "MT";
}

export function AppDataDrawer({ visible, onClose }: AppDataDrawerProps) {
  const { language } = useTranslation();
  const drawerCopy = getDrawerCopy(language);
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isActive = true;

    async function loadDrawerData() {
      try {
        const loadedAppData = await teamSyncService.getAppData();

        if (isActive) {
          setAppData(loadedAppData);
        }
      } catch {
        if (isActive) {
          setAppData(null);
        }
      }
    }

    setLogoutError("");
    loadDrawerData();

    return () => {
      isActive = false;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const currentUser = appData?.currentUser;
  const currentClub = appData?.club;
  const primaryTeam = currentUser
    ? appData?.teams.find((team) => currentUser.teamIds.includes(team.id))
    : undefined;

  const profileName = currentUser?.fullName ?? drawerCopy.userFallback;
  const profileInitials = getInitials(profileName);
  const profileSubtitle = currentUser
    ? `${drawerCopy.roleLabels[currentUser.role]} · ${primaryTeam?.name ?? currentClub?.name ?? drawerCopy.noClub}`
    : drawerCopy.loadingProfile;

  function handleNavigate(route?: string, isDisabled?: boolean) {
    if (isDisabled || route === undefined || isLoggingOut) {
      return;
    }

    onClose();
    router.push(route as never);
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      setLogoutError("");

      if (authService.isConfigured()) {
        await authService.logout();
      }

      await teamSyncService.resetAppData();
      onClose();
      router.replace("/login" as never);
    } catch {
      setLogoutError(drawerCopy.logoutFailed);
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <View>
            <Text style={styles.logo}>MaviTeam</Text>
            <Text style={styles.title}>{drawerCopy.menuTitle}</Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileInitials}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.profileRole}>{profileSubtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.itemsScroll}
          contentContainerStyle={styles.items}
          showsVerticalScrollIndicator={false}
        >
          {drawerCopy.items.map((item) => {
            return (
              <Pressable
                key={item.label}
                disabled={item.isDisabled || isLoggingOut}
                onPress={() => handleNavigate(item.route, item.isDisabled)}
                style={({ pressed }) => [
                  styles.item,
                  item.isDisabled ? styles.itemDisabled : null,
                  pressed && !item.isDisabled ? styles.pressed : null,
                ]}
              >
                <View style={styles.itemTextArea}>
                  <Text style={[styles.itemLabel, item.isDisabled ? styles.disabledText : null]}>{item.label}</Text>

                  <Text style={[styles.itemSubtitle, item.isDisabled ? styles.disabledText : null]}>{item.subtitle}</Text>
                </View>

                <Text style={[styles.itemArrow, item.isDisabled ? styles.disabledText : null]}>
                  {item.isDisabled ? drawerCopy.soon : "›"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.logoutArea}>
          {logoutError !== "" ? <Text style={styles.logoutError}>{logoutError}</Text> : null}

          <Pressable
            disabled={isLoggingOut}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={drawerCopy.logout}
            style={({ pressed }) => [
              styles.logoutButton,
              isLoggingOut ? styles.logoutButtonDisabled : null,
              pressed && !isLoggingOut ? styles.pressed : null,
            ]}
          >
            <View style={styles.logoutTextArea}>
              <Text style={styles.logoutTitle}>{isLoggingOut ? drawerCopy.loggingOut : drawerCopy.logout}</Text>
              <Text style={styles.logoutSubtitle}>{drawerCopy.logoutSubtitle}</Text>
            </View>
            <Text style={styles.logoutArrow}>↗</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default AppDataDrawer;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.44)",
  },
  drawer: {
    width: 310,
    maxWidth: "84%",
    height: "100%",
    backgroundColor: theme.colors.background.surface,
    paddingTop: theme.spacing["4xl"],
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderTopRightRadius: theme.radius["2xl"],
    borderBottomRightRadius: theme.radius["2xl"],
    ...theme.shadows.md,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginTop: -2,
  },
  profileCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.sm,
  },
  itemsScroll: {
    flex: 1,
  },
  items: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  item: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.subtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  itemDisabled: {
    opacity: 0.45,
  },
  itemTextArea: {
    flex: 1,
  },
  itemLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  itemSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.sm,
  },
  itemArrow: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  logoutArea: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    paddingTop: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  logoutButton: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.state.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.22)",
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  logoutButtonDisabled: {
    opacity: 0.62,
  },
  logoutTextArea: {
    flex: 1,
  },
  logoutTitle: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  logoutSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.sm,
  },
  logoutArrow: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  logoutError: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.lineHeights.sm,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
