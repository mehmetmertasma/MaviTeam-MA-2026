import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// One consistent "there's nothing here yet" moment, used across every list
// screen (schedule with no events, messages with no conversations, payments
// with no records, etc.) instead of each screen inventing its own text.
export function EmptyState({ icon = "•", title, description, actionLabel, onAction, style, children }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      {children}

      {actionLabel && onAction ? (
        <AppButton title={actionLabel} variant="secondary" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: theme.fontSizes["2xl"],
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    lineHeight: theme.lineHeights.md,
    maxWidth: 320,
  },
  action: {
    marginTop: theme.spacing.md,
  },
});