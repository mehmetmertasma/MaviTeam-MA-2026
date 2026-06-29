import { Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type AppButtonVariant = "primary" | "secondary" | "ghost";

type AppButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const variantStyles: Record<
  AppButtonVariant,
  {
    button: ViewStyle;
    text: TextStyle;
  }
> = {
  primary: {
    button: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    text: {
      color: theme.colors.text.inverse,
    },
  },
  secondary: {
    button: {
      backgroundColor: theme.colors.brand.primarySoft,
      borderColor: theme.colors.brand.primarySoft,
    },
    text: {
      color: theme.colors.text.brand,
    },
  },
  ghost: {
    button: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border.default,
    },
    text: {
      color: theme.colors.text.brand,
    },
  },
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
}: AppButtonProps) {
  const selectedVariant = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selectedVariant.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          selectedVariant.text,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default AppButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.lg,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    backgroundColor: theme.colors.border.strong,
    borderColor: theme.colors.border.strong,
    opacity: 0.72,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
});
