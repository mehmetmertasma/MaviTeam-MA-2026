import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "@/constants/theme";

type AppBackButtonProps = {
  label?: string;
  fallbackHref?: string;
  onPress?: () => void;
};

export function AppBackButton({ label = "Geri dön", fallbackHref = "/dashboard", onPress }: AppBackButtonProps) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref as never);
  }

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}>
      <Text style={styles.icon}>←</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  icon: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    textAlignVertical: "center",
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    textAlignVertical: "center",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
