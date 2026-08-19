import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '@/theme';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 88 }: LogoProps) {
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
        <Ionicons name="musical-notes" size={size * 0.5} color={colors.textInverse} />
      </LinearGradient>
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkDark}>Deep</Text>
        <Text style={styles.wordmarkPrimary}> Scales</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
