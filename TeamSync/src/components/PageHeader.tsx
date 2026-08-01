import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { Card } from "@/components/Card";
import { theme } from "@/constants/theme";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// The title block every screen shows at the top of its content: an
// optional eyebrow, the page title, an optional subtitle/badge, and an
// optional trailing action (button). Extracted from dashboard.tsx so every
// screen shares one implementation instead of hand-rolling its own header
// styles.
export function PageHeader({ eyebrow, title, subtitle, badge, action, style }: PageHeaderProps) {
  return (
    <Card style={[styles.header, style]}>
      <View style={styles.titleArea}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {badge ? <View style={styles.badgeRow}>{badge}</View> : null}
      </View>

      {action ? action : null}
    </Card>
  );
}

export default PageHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  titleArea: {
    flex: 1,
    minWidth: 200,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.bold,
    lineHeight: theme.lineHeights["4xl"],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.regular,
  },
  badgeRow: {
    marginTop: theme.spacing.xs,
  },
});
