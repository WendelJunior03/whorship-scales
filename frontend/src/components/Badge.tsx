import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type BadgeTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const toneColors: Record<BadgeTone, { bg: string; text: string }> = {
  primary: { bg: colors.primary + '33', text: colors.primary },
  success: { bg: colors.success + '33', text: colors.success },
  warning: { bg: colors.warning + '33', text: colors.warning },
  error: { bg: colors.error + '33', text: colors.error },
  neutral: { bg: colors.surfaceElevated, text: colors.textSecondary },
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const { bg, text } = toneColors[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
