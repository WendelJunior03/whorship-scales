import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, shadows } from '@/theme';

interface LogoProps {
  /** Tamanho do emblema (o wordmark acompanha). */
  size?: number;
  /** Mostra o nome "Deep Scales" abaixo do emblema. */
  showWordmark?: boolean;
}

/**
 * Marca do app em código (vetorial): emblema com gradiente azul + nota musical,
 * e o wordmark "Deep Scales". Substitui o PNG antigo (roxo) e acompanha o tema.
 */
export function Logo({ size = 72, showWordmark = true }: LogoProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          shadows.md,
          { width: size, height: size, borderRadius: size * 0.28 },
        ]}
      >
        <Ionicons name="musical-notes" size={size * 0.5} color={colors.textInverse} />
      </LinearGradient>

      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: size * 0.34 }]}>
          Deep <Text style={styles.wordmarkAccent}>Scales</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
  },
  wordmark: {
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: 0.3,
  },
  wordmarkAccent: {
    color: colors.primary,
  },
});
