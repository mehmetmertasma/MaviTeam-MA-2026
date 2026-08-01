import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

export type StatusBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<StatusBadgeTone, { background: string; text: string; dot: string }> = {
  success: {
    background: theme.colors.state.successSoft,
    text: theme.colors.text.success,
    dot: theme.colors.state.success,
  },
  warning: {
    background: theme.colors.state.warningSoft,
    text: theme.colors.text.warning,
    dot: theme.colors.state.warning,
  },
  danger: {
    background: theme.colors.state.dangerSoft,
    text: theme.colors.text.danger,
    dot: theme.colors.state.danger,
  },
  info: {
    background: theme.colors.state.infoSoft,
    text: theme.colors.text.brand,
    dot: theme.colors.state.info,
  },
  neutral: {
    background: theme.colors.background.subtle,
    text: theme.colors.text.secondary,
    dot: theme.colors.text.muted,
  },
};

// A status is always communicated with a dot + text label together, never
// color alone — this is a hard requirement (color-blind users, low-light
// phone screens, and grayscale printouts/screenshots all lose pure-color
// signals). Every screen that shows a paid/unpaid, pending/active,
// present/absent, etc. state should use this instead of a one-off colored
// Text element.
export function StatusBadge({ label, tone = "neutral", style }: StatusBadgeProps) {
  const selectedTone = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: selectedTone.background }, style]}>
      <View style={[styles.dot, { backgroundColor: selectedTone.dot }]} />
      <Text style={[styles.label, { color: selectedTone.text }]}>{label}</Text>
    </View>
  );
}

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
});