import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { spacing } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Container padrão pra blocos de conteúdo (cultos, membros, itens de lista).
 * Vira Pressable (com leve encolhida ao toque) automaticamente se receber onPress;
 * sempre entra com um fade+subida suave (T-04.7).
 */
export function Card({ children, onPress, style }: CardProps) {
  const styles = useThemedStyles(criarEstilos);
  const escala = useSharedValue(1);
  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  if (onPress) {
    return (
      <PressableAnimado
        style={[styles.card, style, estiloEscala]}
        onPress={onPress}
        accessibilityRole="button"
        onPressIn={() => {
          escala.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          escala.value = withTiming(1, { duration: 150 });
        }}
        entering={FadeInUp.duration(250)}
      >
        {children}
      </PressableAnimado>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(250)} style={[styles.card, style]}>
      {children}
    </Animated.View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
