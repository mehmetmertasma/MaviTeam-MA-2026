import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type ErrorStateProps = {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
};

// One consistent "something went wrong" moment with a retry action, so a
// failed Firestore read looks and behaves the same on every screen instead
// of each screen showing its own ad-hoc error text.
export function ErrorState({ title, description, retryLabel, onRetry, style }: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>!</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      {retryLabel && onRetry ? (
        <AppButton title={retryLabel} variant="secondary" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

export default ErrorState;

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
    backgroundColor: theme.colors.state.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  icon: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
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