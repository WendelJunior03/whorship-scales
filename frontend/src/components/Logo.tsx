import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/Icon';
import { radius, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 88 }: LogoProps) {
  const { colors, shadows } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconBox,
          shadows.md,
          { width: size, height: size, borderRadius: size * 0.28 },
        ]}
      >
        <Icon name="musical-notes" size={size * 0.5} color={colors.textInverse} />
      </LinearGradient>
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkDark}>Deep</Text>
        <Text style={styles.wordmarkPrimary}> Scales</Text>
      </Text>
    </View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xxl,
    marginBottom: 12,
  },
  wordmark: {
    ...typography.h1,
  },
  wordmarkDark: {
    color: colors.text,
  },
  wordmarkPrimary: {
    color: colors.primary,
  },
});
