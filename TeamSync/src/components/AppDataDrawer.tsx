import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
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

const roleLabels: Record<UserRole, string> = {
  superAdmin: "Platform yöneticisi",
  clubAdmin: "Kulüp yöneticisi",
  coach: "Koç",
  parent: "Veli",
  athlete: "Sporcu",
};

const drawerItems: DrawerItem[] = [
  { label: "Dashboard", subtitle: "Kulüp kontrol merkezi", route: "/dashboard" },
  { label: "Messages", subtitle: "Takım ve bireysel mesajlar", route: "/messages" },
  { label: "Announcements", subtitle: "Kulüp duyuruları", route: "/announcements" },
  { label: "Schedule", subtitle: "Antrenman ve maç takvimi", route: "/schedule" },
  { label: "Attendance", subtitle: "Yoklama sistemi", route: "/attendance" },
  { label: "Availability", subtitle: "Geliyorum / gelemiyorum bildirimi", route: "/availability" },
  { label: "Teams", subtitle: "Takım yönetimi", route: "/teams" },
  { label: "Payments", subtitle: "Ödeme takibi", route: "/payments" },
  { label: "Statistics", subtitle: "Performans ve katılım özeti", route: "/statistics" },
  { label: "Replays", subtitle: "Video ve drill içerikleri", route: "/replays" },
  { label: "Profile", subtitle: "Profil bilgileri", route: "/profile" },
  { label: "Settings", subtitle: "Uygulama ayarları", isDisabled: true },
];

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "TS";
}

export function AppDataDrawer({ visible, onClose }: AppDataDrawerProps) {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);

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

  const profileName = currentUser?.fullName ?? "TeamSync Kullanıcı";
  const profileInitials = getInitials(profileName);
  const profileSubtitle = currentUser
    ? `${roleLabels[currentUser.role]} · ${primaryTeam?.name ?? currentClub?.name ?? "Kulüp yok"}`
    : "Profil bilgileri yükleniyor";

  function handleNavigate(route?: string, isDisabled?: boolean) {
    if (isDisabled || route === undefined) {
      return;
    }

    onClose();
    router.push(route as never);
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <View>
            <Text style={styles.logo}>TeamSync</Text>
            <Text style={styles.title}>Menu</Text>
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
          {drawerItems.map((item) => {
            return (
              <Pressable
                key={item.label}
                disabled={item.isDisabled}
                onPress={() => handleNavigate(item.route, item.isDisabled)}
                style={({ pressed }) => [
                  styles.item,
                  item.isDisabled ? styles.itemDisabled : null,
                  pressed && !item.isDisabled ? styles.pressed : null,
                ]}
              >
                <View style={styles.itemTextArea}>
                  <Text style={[styles.itemLabel, item.isDisabled ? styles.disabledText : null]}>
                    {item.label}
                  </Text>

                  <Text style={[styles.itemSubtitle, item.isDisabled ? styles.disabledText : null]}>
                    {item.subtitle}
                  </Text>
                </View>

                <Text style={[styles.itemArrow, item.isDisabled ? styles.disabledText : null]}>
                  {item.isDisabled ? "Soon" : "›"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
  },
  profileRole: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  itemsScroll: {
    flex: 1,
  },
  items: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing["2xl"],
  },
  item: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemTextArea: {
    flex: 1,
  },
  itemLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  itemSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  itemArrow: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
