import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Shared search box for the people-lists across Teams/Messages -- roster,
// add-member picker, DM picker, and group-member popover all reuse this so
// a 200-member club stays scannable instead of a flat wall of names.
export function SearchField({ value, onChangeText, placeholder = "İsim veya e-posta ara...", accessibilityLabel = "Ara", style }: SearchFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} accessibilityLabel="Aramayı temizle" hitSlop={8}>
          <Text style={styles.clear}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchField;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.md,
  },
  icon: { fontSize: theme.fontSizes.md },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
  },
  clear: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    paddingHorizontal: theme.spacing.xs,
  },
});
