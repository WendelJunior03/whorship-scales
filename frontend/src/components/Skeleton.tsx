import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius as radiusTokens, spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Raio dos cantos (default: raio pequeno do tema). */
  radius?: number;
  style?: ViewStyle;
}

/**
 * Placeholder pulsante para estados de carregamento. Substitui o
 * `ActivityIndicator`/"Carregando…" espalhado nas telas por um esqueleto no
 * formato do conteúdo. Anima via Reanimated (mesmo padrão de Button/Card).
 */
export function Skeleton({ width = '100%', height = 16, radius = radiusTokens.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacidade = useSharedValue(0.5);

  useEffect(() => {
    opacidade.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacidade);
  }, [opacidade]);

  const estiloPulso = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <Animated.View
      // Placeholder decorativo: o leitor de tela deve ignorá-lo (o conteúdo real
      // é anunciado quando carrega).
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surfaceElevated },
        estiloPulso,
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  /** Quantas linhas de texto simular. */
  lines?: number;
  style?: ViewStyle;
}

/** Bloco de linhas de texto (a última sai mais curta, como um parágrafo real). */
export function SkeletonText({ lines = 3, style }: SkeletonTextProps) {
  return (
    <View style={[styles.textWrap, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  textWrap: { gap: spacing.sm },
});
