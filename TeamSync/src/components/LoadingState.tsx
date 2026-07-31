import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type LoadingStateProps = {
  label?: string;
  size?: "small" | "large";
  style?: StyleProp<ViewStyle>;
};

// A real spinner, used consistently for "data is on its way" moments.
// Before this, every screen only changed a text label ("Yükleniyor...")
// with no visual indicator anywhere in the app.
export function LoadingState({ label, size = "large", style }: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={theme.colors.brand.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

// Small inline spinner for use next to text, inside a row, etc. — not a
// full centered block like LoadingState.
export function InlineLoadingIndicator({ color }: { color?: string }) {
  return <ActivityIndicator size="small" color={color ?? theme.colors.brand.primary} />;
}

export default LoadingState;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["3xl"],
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
  },
});