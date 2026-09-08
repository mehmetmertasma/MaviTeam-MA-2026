import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { supportedLanguages, useTranslation } from "@/localization";

type LanguageSelectorProps = {
  compact?: boolean;
};

// A plain two-segment control instead of a "current -> next" toggle: you see
// both options and tap the one you want, rather than reading an arrow to
// figure out what tapping does. Flag emoji were dropped entirely -- on
// Windows they don't render as flags at all, just as literal "TR"/"US" text,
// which was the actual clutter in the old design, not just the shape/color.
export const LanguageSelector = memo(function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      {!compact ? (
        <View style={styles.header}>
          <Text style={styles.title}>{t.language.title}</Text>
          <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        </View>
      ) : null}

      <View style={[styles.segmentGroup, compact ? styles.compactSegmentGroup : null]}>
        {supportedLanguages.map((option) => {
          const isActive = option.code === language;
          const label = compact ? option.shortLabel : option.nativeLabel;

          return (
            <Pressable
              key={option.code}
              onPress={() => setLanguage(option.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t.language.title}: ${option.nativeLabel}`}
              style={({ pressed }) => [
                styles.segment,
                compact ? styles.compactSegment : null,
                isActive ? styles.segmentActive : null,
                pressed && !isActive ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  compact ? styles.compactSegmentText : null,
                  isActive ? styles.segmentTextActive : null,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

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
    fontWeight: theme.fontWeights.semibold,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  segmentGroup: {
    flexDirection: "row",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.subtle,
    padding: 3,
    gap: 3,
  },
  compactSegmentGroup: {
    borderRadius: theme.radius.md,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
  },
  compactSegment: {
    minHeight: 30,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  segmentActive: {
    backgroundColor: theme.colors.brand.primary,
  },
  segmentText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  compactSegmentText: {
    fontSize: theme.fontSizes.sm,
  },
  segmentTextActive: {
    color: theme.colors.text.inverse,
  },
  pressed: {
    opacity: 0.7,
  },
});
