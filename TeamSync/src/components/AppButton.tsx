import { forwardRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { ComponentRef } from "react";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const variantStyles: Record<
  AppButtonVariant,
  {
    button: ViewStyle;
    pressed: ViewStyle;
    text: TextStyle;
    spinnerColor: string;
  }
> = {
  primary: {
    button: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
      ...theme.shadows.sm,
    },
    pressed: {
      backgroundColor: theme.colors.brand.primaryPressed,
      borderColor: theme.colors.brand.primaryPressed,
    },
    text: {
      color: theme.colors.text.inverse,
    },
    spinnerColor: theme.colors.text.inverse,
  },
  secondary: {
    button: {
      backgroundColor: theme.colors.brand.primarySoft,
      borderColor: theme.colors.brand.primarySoft,
    },
    pressed: {
      backgroundColor: theme.colors.brand.secondarySoft,
      borderColor: theme.colors.brand.secondarySoft,
    },
    text: {
      color: theme.colors.text.brand,
    },
    spinnerColor: theme.colors.text.brand,
  },
  ghost: {
    button: {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border.default,
    },
    pressed: {
      backgroundColor: theme.colors.background.subtle,
      borderColor: theme.colors.border.strong,
    },
    text: {
      color: theme.colors.text.brand,
    },
    spinnerColor: theme.colors.text.brand,
  },
  danger: {
    button: {
      backgroundColor: theme.colors.state.dangerSoft,
      borderColor: "rgba(225, 29, 72, 0.28)",
    },
    pressed: {
      backgroundColor: "rgba(254, 205, 211, 0.9)",
      borderColor: theme.colors.state.danger,
    },
    text: {
      color: theme.colors.text.danger,
    },
    spinnerColor: theme.colors.text.danger,
  },
};

export const AppButton = forwardRef<ComponentRef<typeof Pressable>, AppButtonProps>(function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  style,
  textStyle,
  ...pressableProps
}, ref) {
  const selectedVariant = variantStyles[variant];
  const isDisabled = disabled === true || loading === true;

  return (
    <Pressable
      {...pressableProps}
      ref={ref}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selectedVariant.button,
        pressed && !isDisabled ? [styles.pressed, selectedVariant.pressed] : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={selectedVariant.spinnerColor} />
      ) : (
        <Text
          style={[
            styles.text,
            selectedVariant.text,
            isDisabled ? styles.disabledText : null,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
});

AppButton.displayName = "AppButton";

export default AppButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extrabold,
    lineHeight: theme.lineHeights.lg,
    letterSpacing: 0.1,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    backgroundColor: theme.colors.border.strong,
    borderColor: theme.colors.border.strong,
    opacity: 0.7,
    ...theme.shadows.none,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
});