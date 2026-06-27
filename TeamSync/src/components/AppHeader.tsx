import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { theme } from "@/constants/theme";

type AppHeaderMode = "menu" | "back";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  mode?: AppHeaderMode;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  profileInitials?: string;
  rightContent?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({
  title,
  subtitle,
  mode = "menu",
  onMenuPress,
  onBackPress,
  onProfilePress,
  profileInitials = "MA",
  rightContent,
  style,
}: AppHeaderProps) {
  function handleLeftPress() {
    if (mode === "back") {
      if (onBackPress) {
        onBackPress();
        return;
      }

      router.back();
      return;
    }

    if (onMenuPress) {
      onMenuPress();
    }
  }

  function handleProfilePress() {
    if (onProfilePress) {
      onProfilePress();
      return;
    }

    router.push("/profile");
  }

  return (
    <View style={[styles.header, style]}>
      <Pressable
        onPress={handleLeftPress}
        style={({ pressed }) => [
          styles.iconButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.leftIcon}>{mode === "back" ? "‹" : "☰"}</Text>
      </Pressable>

      <View style={styles.titleArea}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightContent ? (
        rightContent
      ) : (
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.profileButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.profileText}>{profileInitials}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default AppHeader;

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingTop: theme.spacing["2xl"],
    paddingBottom: theme.spacing.lg,
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
  leftIcon: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["2xl"],
  },
  titleArea: {
    flex: 1,
  },
  title: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
  },
  subtitle: {
    color: theme.colors.text.inverse,
    opacity: 0.72,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
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
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});