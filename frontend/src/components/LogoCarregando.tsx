import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import palhetaIcone from '../../assets/logo/palheta-transparente.png';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoCarregandoProps {
  texto?: string;
}

/** Ícone da logo com um círculo de carregamento girando em volta/por cima. */
export function LogoCarregando({ texto }: LogoCarregandoProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.stack}>
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icone}
        >
          <Image
            source={palhetaIcone}
            style={{ width: 34, height: 34, tintColor: colors.textInverse }}
            resizeMode="contain"
          />
        </LinearGradient>
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size={84} color={colors.primary} />
        </View>
      </View>
      {texto ? <Text style={[styles.texto, { color: colors.textSecondary }]}>{texto}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  stack: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  icone: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  spinner: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  texto: { ...typography.bodySmall },
});
