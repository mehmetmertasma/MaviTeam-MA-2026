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
  slate950: "#020617",

  navy50: "#EEF2F6",
  navy100: "#DCE4ED",
  navy500: "#3E6A9E",
  navy600: "#1F3B63",
  navy700: "#16283F",

  emerald50: "#E7F5EF",
  emerald500: "#0F8B5F",
  emerald600: "#0F8B5F",
  emerald700: "#0B6E4A",

  amber50: "#FBF1E2",
  amber500: "#B7791F",
  amber600: "#B7791F",
  amberText: "#8A5A16",

  rose50: "#FBEAEA",
  rose500: "#C23B3B",
  rose600: "#C23B3B",
  roseText: "#9A2F2F",
} as const;

export const theme = {
  colors: {
    brand: {
      primary: palette.navy600,
      primaryPressed: palette.navy700,
      primarySoft: palette.navy50,
      secondary: palette.slate600,
      secondaryPressed: palette.slate800,
      secondarySoft: palette.slate100,
    },

    background: {
      app: palette.slate950,
      lightApp: palette.slate50,
      surface: palette.white,
      subtle: palette.slate50,
      elevated: palette.white,
    },

    text: {
      primary: palette.slate900,
      secondary: palette.slate600,
      muted: palette.slate500,
      inverse: palette.white,
      brand: palette.navy700,
      success: palette.emerald700,
      warning: palette.amberText,
      danger: palette.roseText,
    },

    border: {
      default: palette.slate200,
      strong: palette.slate300,
      focus: palette.navy500,
    },

    state: {
      success: palette.emerald600,
      successSoft: palette.emerald50,
      warning: palette.amber500,
      warningSoft: palette.amber50,
      danger: palette.rose500,
      dangerSoft: palette.rose50,
      info: palette.navy600,
      infoSoft: palette.navy50,
    },

    danger: {
      soft: palette.rose50,
      text: palette.roseText,
    },

    disabled: {
      background: palette.slate200,
      text: palette.slate400,
      border: palette.slate300,
    },

    divider: palette.slate200,

    overlay: "rgba(2, 6, 23, 0.58)",
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
    xl: 18,
    "2xl": 28,
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
      shadowColor: palette.slate950,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: palette.slate950,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.slate950,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.09,
      shadowRadius: 20,
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

// Named text styles covering the hierarchy a screen actually needs, so
// components can write `Typography.pageTitle` instead of re-combining
// fontSize + fontWeight + lineHeight by hand every time (and drifting out
// of sync with each other screen that does the same thing slightly
// differently). Existing per-field theme usage still works unchanged.
export const Typography = {
  displayTitle: { fontSize: theme.fontSizes["5xl"], fontWeight: theme.fontWeights.bold, lineHeight: theme.lineHeights["5xl"] },
  pageTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, lineHeight: theme.lineHeights["4xl"] },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights["2xl"] },
  cardTitle: { fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  body: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.lg },
  supporting: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  label: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  button: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.lg },
  caption: { fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, lineHeight: theme.lineHeights.sm },
  statNumber: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, lineHeight: theme.lineHeights["4xl"] },
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
    default: 0,
  }) ?? 0;

export const MaxContentWidth = 1180;
export const ScreenMaxWidth = 520;
export const ContentMaxWidth = 980;

export const Breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;

export const platform = {
  isWeb: Platform.OS === "web",
} as const;