import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const isDisabled = disabled || loading;
  const escala = useSharedValue(1);
  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const pressIn = () => {
    escala.value = withTiming(0.97, { duration: 100 });
  };
  const pressOut = () => {
    escala.value = withTiming(1, { duration: 150 });
  };

  if (variant === 'outline') {
    return (
      <PressableAnimado
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        style={[styles.outline, isDisabled && styles.disabled, style, estiloEscala]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.outlineText}>{title}</Text>
        )}
      </PressableAnimado>
    );
  }

  return (
    <PressableAnimado
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[style, estiloEscala]}
    >
      <LinearGradient
        colors={isDisabled ? [colors.textMuted, colors.textMuted] : colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </PressableAnimado>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  gradient: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.h3,
    color: colors.textInverse,
  },
  outline: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    ...typography.h3,
    color: colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
