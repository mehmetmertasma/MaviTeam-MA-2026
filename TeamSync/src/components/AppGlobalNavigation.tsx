import { router, usePathname } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppDataDrawer } from "@/components/AppDataDrawer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";

const routesWithoutTopControls = [
  "/",
  "/login",
  "/register",
  "/create-club",
  "/join-club",
  "/join-request-sent",
];

const TOP_CONTROL_OFFSET = 10;

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

export function AppGlobalNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { appData } = useAppDataContext();
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const profileInitials = getInitials(appData?.currentUser.fullName ?? "");

  if (routesWithoutTopControls.includes(pathname)) {
    return null;
  }

  const showProfileButton = pathname !== "/profile";

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (pathname === "/dashboard") {
      router.replace("/" as never);
      return;
    }

    router.replace("/dashboard" as never);
  }

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View pointerEvents="box-none" style={[styles.topControls, { top: insets.top + TOP_CONTROL_OFFSET }]}>
        <View pointerEvents="box-none" style={styles.leftControls}>
          <Pressable
            onPress={() => setDrawerIsOpen(true)}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
            accessibilityLabel="Open main menu"
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>

          <Pressable
            onPress={handleBackPress}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
            accessibilityLabel={t.common.back}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>{t.common.back}</Text>
          </Pressable>
        </View>

        <View pointerEvents="box-none" style={styles.rightControls}>
          <LanguageSelector compact />

          {showProfileButton ? (
            <Pressable
              onPress={() => router.push("/profile" as never)}
              style={({ pressed }) => [styles.profileButton, pressed ? styles.pressed : null]}
              accessibilityLabel="Open profile"
            >
              <Text style={styles.profileText}>{profileInitials}</Text>
            </Pressable>
          ) : (
            <View style={styles.profileSpacer} />
          )}
        </View>
      </View>

      <AppDataDrawer visible={drawerIsOpen} onClose={() => setDrawerIsOpen(false)} />
    </View>
  );
}

export default AppGlobalNavigation;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 900,
  },
  topControls: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 901,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  menuIcon: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginTop: -2,
  },
  backButton: {
    minWidth: 72,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    textAlignVertical: "center",
  },
  backText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    textAlignVertical: "center",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  profileText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  profileSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});
