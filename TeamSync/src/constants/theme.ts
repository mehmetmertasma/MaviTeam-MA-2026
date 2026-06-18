import { Platform } from "react-native";

const palette = {
  white: "#FFFFFF",
  black: "#111827",

  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  sky50: "#F0F9FF",
  sky100: "#E0F2FE",
  sky500: "#0EA5E9",
  sky600: "#0284C7",
  sky700: "#0369A1",

  emerald50: "#ECFDF5",
  emerald500: "#10B981",
  emerald600: "#059669",
  emerald700: "#047857",

  amber50: "#FFFBEB",
  amber500: "#F59E0B",
  amber600: "#D97706",

  rose50: "#FFF1F2",
  rose500: "#F43F5E",
  rose600: "#E11D48",
} as const;

export const theme = {
  colors: {
    brand: {
      primary: palette.sky600,
      primaryPressed: palette.sky700,
      primarySoft: palette.sky50,
      secondary: palette.emerald600,
      secondaryPressed: palette.emerald700,
      secondarySoft: palette.emerald50,
    },

    background: {
      app: palette.slate900,
      lightApp: palette.slate50,
      surface: palette.white,
      subtle: palette.slate100,
      elevated: palette.white,
    },

    text: {
      primary: palette.slate900,
      secondary: palette.slate600,
      muted: palette.slate500,
      inverse: palette.white,
      brand: palette.sky700,
      success: palette.emerald700,
      warning: palette.amber600,
      danger: palette.rose600,
    },

    border: {
      default: palette.slate200,
      strong: palette.slate300,
      focus: palette.sky500,
    },

    state: {
      success: palette.emerald600,
      successSoft: palette.emerald50,
      warning: palette.amber500,
      warningSoft: palette.amber50,
      danger: palette.rose500,
      dangerSoft: palette.rose50,
      info: palette.sky600,
      infoSoft: palette.sky50,
    },

    overlay: "rgba(15, 23, 42, 0.48)",
  },

  spacing: {
    none: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    "5xl": 48,
    "6xl": 64,

    // Backward-compatible aliases for existing Expo starter files
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
  },

  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    "2xl": 24,
    full: 999,
  },

  fontSizes: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 30,
    "5xl": 36,
  },

  fontWeights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  lineHeights: {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28,
    "2xl": 32,
    "3xl": 36,
    "4xl": 40,
    "5xl": 44,
  },

  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: palette.slate900,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: palette.slate900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.slate900,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 5,
    },
  },
} as const;

export const Colors = {
  light: {
    text: theme.colors.text.primary,
    background: theme.colors.background.lightApp,
    backgroundElement: theme.colors.background.surface,
    backgroundSelected: theme.colors.brand.primarySoft,
    textSecondary: theme.colors.text.secondary,
  },

  dark: {
    text: theme.colors.text.inverse,
    background: theme.colors.background.app,
    backgroundElement: palette.slate800,
    backgroundSelected: palette.slate700,
    textSecondary: palette.slate300,
  },

  primary: theme.colors.brand.primary,
  primaryDark: theme.colors.brand.primaryPressed,
  primaryLight: theme.colors.brand.primarySoft,

  secondary: theme.colors.brand.secondary,
  secondaryDark: theme.colors.brand.secondaryPressed,
  secondaryLight: theme.colors.brand.secondarySoft,

  background: theme.colors.background.app,
  lightBackground: theme.colors.background.lightApp,
  surface: theme.colors.background.surface,
  surfaceMuted: theme.colors.background.subtle,

  text: theme.colors.text.primary,
  textSecondary: theme.colors.text.secondary,
  textMuted: theme.colors.text.muted,
  textInverse: theme.colors.text.inverse,

  border: theme.colors.border.default,
  borderStrong: theme.colors.border.strong,

  success: theme.colors.state.success,
  successLight: theme.colors.state.successSoft,
  warning: theme.colors.state.warning,
  warningLight: theme.colors.state.warningSoft,
  danger: theme.colors.state.danger,
  dangerLight: theme.colors.state.dangerSoft,
} as const;

export type ThemeColor = keyof typeof Colors.light | keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    sans: "sans",
    serif: "serif",
    rounded: "sans",
    mono: "monospace",
  },
  web: {
    sans: "system-ui",
    serif: "serif",
    rounded: "system-ui",
    mono: "monospace",
  },
  default: {
    sans: "System",
    serif: "serif",
    rounded: "System",
    mono: "monospace",
  },
});

export const Spacing = theme.spacing;
export const Radius = theme.radius;
export const FontSizes = theme.fontSizes;
export const FontWeights = theme.fontWeights;
export const Shadows = theme.shadows;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
    default: 0,
  }) ?? 0;

export const MaxContentWidth = 1180;
export const ScreenMaxWidth = 520;