import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { supportedLanguages, useTranslation } from "@/localization";

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();
  const currentLanguage = supportedLanguages.find((item) => item.code === language) ?? supportedLanguages[0];
  const nextLanguage = supportedLanguages.find((item) => item.code !== language) ?? currentLanguage;
  const switchLabel = compact
    ? `${currentLanguage.shortLabel} → ${nextLanguage.shortLabel}`
    : `${currentLanguage.nativeLabel} → ${nextLanguage.nativeLabel}`;

  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      {!compact ? (
        <View style={styles.header}>
          <Text style={styles.title}>{t.language.title}</Text>
          <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => setLanguage(nextLanguage.code)}
        accessibilityRole="button"
        accessibilityLabel={`Switch language to ${nextLanguage.nativeLabel}`}
        style={({ pressed }) => [
          styles.toggle,
          compact ? styles.compactToggle : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.currentSide}>
          <Text style={styles.flag}>{currentLanguage.flag}</Text>
          <View style={styles.languageTextArea}>
            {!compact ? <Text style={styles.metaLabel}>{t.language.title}</Text> : null}
            <Text style={[styles.toggleText, compact ? styles.compactToggleText : null]}>{switchLabel}</Text>
          </View>
        </View>

        <View style={styles.nextPill}>
          <Text style={styles.nextPillText}>{nextLanguage.shortLabel}</Text>
        </View>
      </Pressable>
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
  toggle: {
    minHeight: 56,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  compactToggle: {
    minHeight: 38,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  currentSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  flag: {
    fontSize: theme.fontSizes.lg,
  },
  languageTextArea: {
    flex: 1,
  },
  metaLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.extrabold,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  toggleText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  compactToggleText: {
    fontSize: theme.fontSizes.sm,
  },
  nextPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  nextPillText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});
