import { router, usePathname } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppDrawer } from "@/components/AppDrawer";
import { theme } from "@/constants/theme";

const routesWithoutTopControls = [
  "/",
  "/login",
  "/register",
  "/create-club",
  "/join-club",
  "/join-request-sent",
];

export function AppGlobalNavigation() {
  const pathname = usePathname();
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);

  if (routesWithoutTopControls.includes(pathname)) {
    return null;
  }

  const showProfileButton = pathname !== "/profile";

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View pointerEvents="box-none" style={styles.topControls}>
        <Pressable
          onPress={() => setDrawerIsOpen(true)}
          style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}
          accessibilityLabel="Ana menüyü aç"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>

        {showProfileButton ? (
          <Pressable
            onPress={() => router.push("/profile" as never)}
            style={({ pressed }) => [styles.profileButton, pressed ? styles.pressed : null]}
            accessibilityLabel="Profil sayfasına git"
          >
            <Text style={styles.profileText}>MA</Text>
          </Pressable>
        ) : (
          <View style={styles.profileSpacer} />
        )}
      </View>

      <AppDrawer visible={drawerIsOpen} onClose={() => setDrawerIsOpen(false)} />
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
    top: 10,
    left: 18,
    right: 18,
    zIndex: 901,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
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
    fontWeight: theme.fontWeights.black,
    marginTop: -2,
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
    fontWeight: theme.fontWeights.black,
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
