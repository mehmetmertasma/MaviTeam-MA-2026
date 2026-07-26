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
  allowedRoles?: UserRole[];
};

const allRoles: UserRole[] = ["superAdmin", "clubAdmin", "coach", "parent", "athlete"];
const staffRoles: UserRole[] = ["superAdmin", "clubAdmin", "coach"];
const adminRoles: UserRole[] = ["superAdmin", "clubAdmin"];
const paymentRoles: UserRole[] = ["superAdmin", "clubAdmin", "parent"];

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
        { label: "Dashboard", subtitle: "Club command center", route: "/dashboard", allowedRoles: allRoles },
        { label: "Teams", subtitle: "Team management", route: "/teams", allowedRoles: staffRoles },
        { label: "Members", subtitle: "Roles, status and team access", route: "/members", allowedRoles: adminRoles },
        { label: "Approvals", subtitle: "Review pending join requests", route: "/pending-approvals", allowedRoles: adminRoles },
        { label: "Schedule", subtitle: "Practices and match calendar", route: "/schedule", allowedRoles: allRoles },
        { label: "Attendance", subtitle: "Attendance tracking", route: "/attendance", allowedRoles: staffRoles },
        { label: "Availability", subtitle: "Available / unavailable responses", route: "/availability", allowedRoles: allRoles },
        { label: "Messages", subtitle: "Team and direct conversations", route: "/messages", allowedRoles: allRoles },
        { label: "Announcements", subtitle: "Club and team updates", route: "/announcements", allowedRoles: allRoles },
        { label: "Payments", subtitle: "Payment tracking", route: "/payments", allowedRoles: paymentRoles },
        { label: "Statistics", subtitle: "Performance and participation summary", route: "/statistics", allowedRoles: staffRoles },
        { label: "Replays", subtitle: "Video and drill content", route: "/replays", allowedRoles: allRoles },
        { label: "Profile", subtitle: "Account and club profile", route: "/profile", allowedRoles: allRoles },
        { label: "Settings", subtitle: "App preferences", isDisabled: true, allowedRoles: allRoles },
      ] satisfies DrawerItem[],
    };
  }

  return {
    menuTitle: "MenÃ¼",
    userFallback: "MaviTeam KullanÄ±cÄ±",
    loadingProfile: "Profil bilgileri yÃ¼kleniyor",
    noClub: "KulÃ¼p yok",
    soon: "YakÄ±nda",
    logout: "Ã‡Ä±kÄ±ÅŸ yap",
    logoutSubtitle: "Bu oturumu gÃ¼venli ÅŸekilde kapat",
    loggingOut: "Ã‡Ä±kÄ±ÅŸ yapÄ±lÄ±yor...",
    logoutFailed: "Ã‡Ä±kÄ±ÅŸ yapÄ±lamadÄ±. LÃ¼tfen tekrar dene.",
    roleLabels: {
      superAdmin: "Platform yÃ¶neticisi",
      clubAdmin: "KulÃ¼p yÃ¶neticisi",
      coach: "KoÃ§",
      parent: "Veli",
      athlete: "Sporcu",
    } satisfies Record<UserRole, string>,
    items: [
      { label: "Panel", subtitle: "KulÃ¼p kontrol merkezi", route: "/dashboard", allowedRoles: allRoles },
      { label: "TakÄ±mlar", subtitle: "TakÄ±m yÃ¶netimi", route: "/teams", allowedRoles: staffRoles },
      { label: "Ãœyeler", subtitle: "Rol, durum ve takÄ±m eriÅŸimi", route: "/members", allowedRoles: adminRoles },
      { label: "Onaylar", subtitle: "Bekleyen katÄ±lÄ±m istekleri", route: "/pending-approvals", allowedRoles: adminRoles },
      { label: "Program", subtitle: "Antrenman ve maÃ§ takvimi", route: "/schedule", allowedRoles: allRoles },
      { label: "Yoklama", subtitle: "KatÄ±lÄ±m takibi", route: "/attendance", allowedRoles: staffRoles },
      { label: "Uygunluk", subtitle: "Geliyorum / gelemiyorum bildirimi", route: "/availability", allowedRoles: allRoles },
      { label: "Mesajlar", subtitle: "TakÄ±m ve bireysel mesajlar", route: "/messages", allowedRoles: allRoles },
      { label: "Duyurular", subtitle: "KulÃ¼p ve takÄ±m duyurularÄ±", route: "/announcements", allowedRoles: allRoles },
      { label: "Ã–demeler", subtitle: "Ã–deme takibi", route: "/payments", allowedRoles: paymentRoles },
      { label: "Ä°statistikler", subtitle: "Performans ve katÄ±lÄ±m Ã¶zeti", route: "/statistics", allowedRoles: staffRoles },
      { label: "Videolar", subtitle: "Video ve drill iÃ§erikleri", route: "/replays", allowedRoles: allRoles },
      { label: "Profil", subtitle: "Hesap ve kulÃ¼p bilgileri", route: "/profile", allowedRoles: allRoles },
      { label: "Ayarlar", subtitle: "Uygulama tercihleri", isDisabled: true, allowedRoles: allRoles },
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

function canShowDrawerItem(item: DrawerItem, userRole?: UserRole) {
  if (item.allowedRoles === undefined || userRole === undefined) {
    return true;
  }

  return item.allowedRoles.includes(userRole);
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
  const visibleDrawerItems = drawerCopy.items.filter((item) => canShowDrawerItem(item, currentUser?.role));

  const profileName = currentUser?.fullName ?? drawerCopy.userFallback;
  const profileInitials = getInitials(profileName);
  const profileSubtitle = currentUser
    ? `${drawerCopy.roleLabels[currentUser.role]} Â· ${primaryTeam?.name ?? currentClub?.name ?? drawerCopy.noClub}`
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

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
            <Text style={styles.closeButtonText}>Ã—</Text>
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

        <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.items} showsVerticalScrollIndicator={false}>
          {visibleDrawerItems.map((item) => (
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
                {item.isDisabled ? drawerCopy.soon : "â€º"}
              </Text>
            </Pressable>
          ))}
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
            <Text style={styles.logoutArrow}>â†—</Text>
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
