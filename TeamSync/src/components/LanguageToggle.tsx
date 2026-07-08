import { Pressable, StyleSheet, Text, View } from "react-native";

import { supportedLanguages } from "@/constants/i18n";
import { theme } from "@/constants/theme";
import { useLanguage } from "@/providers/LanguageProvider";

type LanguageToggleProps = {
  compact?: boolean;
};

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      {!compact ? (
        <View style={styles.header}>
          <Text style={styles.title}>{t.language.title}</Text>
          <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        </View>
      ) : null}

      <View style={styles.options}>
        {supportedLanguages.map((item) => {
          const isSelected = language === item.code;

          return (
            <Pressable
              key={item.code}
              onPress={() => setLanguage(item.code)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} dilini seç`}
              style={({ pressed }) => [
                styles.option,
                compact ? styles.optionCompact : null,
                isSelected ? styles.optionSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                {compact ? item.shortLabel : item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  containerCompact: {
    gap: 0,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  option: {
    minHeight: 44,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCompact: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
  },
  optionSelected: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: theme.colors.brand.primary,
  },
  optionText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  optionTextSelected: {
    color: theme.colors.text.inverse,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});