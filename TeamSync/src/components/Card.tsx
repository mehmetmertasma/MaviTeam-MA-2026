import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type CardVariant = "default" | "elevated" | "subtle" | "danger";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.none,
  },
  elevated: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.md,
  },
  subtle: {
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.none,
  },
  danger: {
    backgroundColor: theme.colors.state.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.22)",
    ...theme.shadows.none,
  },
};

const paddingStyles: Record<CardPadding, number> = {
  none: theme.spacing.none,
  sm: theme.spacing.lg,
  md: theme.spacing["2xl"],
  lg: theme.spacing["3xl"],
};

// The one card container every screen should use instead of hand-rolling
// its own "section"/"heroCard"/"statCard"-style View with slightly
// different radius, border, or shadow values each time.
export function Card({ children, variant = "default", padding = "md", style }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], { padding: paddingStyles[padding] }, style]}>
      {children}
    </View>
  );
}

export default Card;

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius["2xl"],
  },
});