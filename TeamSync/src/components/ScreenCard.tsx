import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { ScreenMaxWidth, theme } from '@/constants/theme';

type ScreenCardProps = {
  children: ReactNode;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ScreenCard({ children, centered = false, style }: ScreenCardProps) {
  return <View style={[styles.card, centered && styles.centered, style]}>{children}</View>;
}

export default ScreenCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: ScreenMaxWidth,
    alignSelf: 'center',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.xl,
    padding: theme.spacing['2xl'],
    ...theme.shadows.md,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});