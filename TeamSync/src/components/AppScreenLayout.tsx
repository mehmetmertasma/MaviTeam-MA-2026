import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ContentMaxWidth, MaxContentWidth, theme } from "@/constants/theme";
import { useResponsive } from "@/hooks/useResponsive";

type AppScreenLayoutProps = {
  children: ReactNode;
  // "standard" fits most screens (forms, lists, settings). "wide" is for
  // screens that lean on multi-column grids, like the dashboard.
  variant?: "standard" | "wide";
  contentStyle?: StyleProp<ViewStyle>;
  scrollContentStyle?: StyleProp<ViewStyle>;
};

// Shared shell for every screen that lives under the persistent
// AppGlobalNavigation bar. Handles: dark app background, vertical scrolling,
// centering content on wide (tablet/web) viewports with a sensible max
// width, and scaling the horizontal padding to the viewport instead of
// using one fixed value for phone and desktop alike.
export function AppScreenLayout({ children, variant = "standard", contentStyle, scrollContentStyle }: AppScreenLayoutProps) {
  const { isDesktop, isTablet } = useResponsive();
  const maxWidth = variant === "wide" ? MaxContentWidth : ContentMaxWidth;
  const horizontalPadding = isDesktop ? theme.spacing["3xl"] : isTablet ? theme.spacing["2xl"] : theme.spacing.xl;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, scrollContentStyle]}>
      <View style={[styles.container, { maxWidth, paddingHorizontal: horizontalPadding }, contentStyle]}>
        {children}
      </View>
    </ScrollView>
  );
}

export default AppScreenLayout;

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  container: { width: "100%", paddingBottom: theme.spacing["4xl"] },
});