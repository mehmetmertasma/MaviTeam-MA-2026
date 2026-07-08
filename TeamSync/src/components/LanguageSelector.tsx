import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { supportedLanguages, useTranslation } from "@/localization";

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      {!compact ? (
        <View style={styles.header}>
          <Text style={styles.title}>{t.language.title}</Text>
          <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        </View>
      ) : null}

      <View style={[styles.options, compact ? styles.compactOptions : null]}>
        {supportedLanguages.map((item) => {
          const isSelected = language === item.code;

          return (
            <Pressable
              key={item.code}
              onPress={() => setLanguage(item.code)}
              accessibilityRole="button"
              accessibilityLabel={item.nativeLabel}
              style={({ pressed }) => [
                styles.option,
                compact ? styles.compactOption : null,
                isSelected ? styles.selectedOption : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[styles.optionText, isSelected ? styles.selectedOptionText : null]}>
                {compact ? item.shortLabel : item.nativeLabel}
              </Text>
              {!compact && isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
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
  compactContainer: {
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
    gap: theme.spacing.sm,
  },
  compactOptions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  option: {
    minHeight: 52,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  compactOption: {
    minHeight: 36,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  selectedOption: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: theme.colors.brand.primary,
  },
  flag: {
    fontSize: theme.fontSizes.md,
  },
  optionText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  selectedOptionText: {
    color: theme.colors.text.inverse,
  },
  checkMark: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});
