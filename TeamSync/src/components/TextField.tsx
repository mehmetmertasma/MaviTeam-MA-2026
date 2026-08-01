import { forwardRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { ComponentRef } from "react";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type TextFieldProps = Omit<TextInputProps, "style" | "placeholderTextColor"> & {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  readOnly?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

// Shared labeled input: label + TextInput + optional error/helper text,
// consistent styling, and an accessibility label derived from the visible
// label unless one is explicitly provided. Replaces the label+TextInput
// pattern that was previously hand-written (with slightly different
// styling each time) in profile.tsx, login.tsx, register.tsx, and others.
export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { label, error, helperText, required = false, readOnly = false, accessibilityLabel, containerStyle, ...inputProps },
  ref
) {
  const hasError = typeof error === "string" && error.trim() !== "";

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      {readOnly ? (
        <Text style={[styles.input, styles.readOnlyInput]}>{String(inputProps.value ?? "")}</Text>
      ) : (
        <TextInput
          ref={ref}
          {...inputProps}
          placeholderTextColor={theme.colors.text.muted}
          accessibilityLabel={accessibilityLabel ?? label}
          style={[styles.input, hasError ? styles.inputError : null]}
        />
      )}

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.text.danger,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
  },
  inputError: {
    borderColor: theme.colors.state.danger,
  },
  readOnlyInput: {
    backgroundColor: theme.colors.background.app,
    color: theme.colors.text.muted,
    textAlignVertical: "center",
  },
  errorText: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  helperText: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
});