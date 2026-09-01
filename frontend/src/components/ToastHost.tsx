import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon, IconName } from './Icon';
import { ToastRequest, ToastTipo, setToastHandler } from '@/utils/toast';

const ICONE: Record<ToastTipo, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
};

/**
 * Host único (montado no root, dentro do ThemeProvider) que renderiza os toasts
 * disparados por showToast(). Mesmo modelo do ConfirmDialogHost: a tela chama a
 * função imperativa e o visual fica centralizado aqui.
 */
export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [req, setReq] = useState<ToastRequest | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const y = useSharedValue(-120);
  const opacidade = useSharedValue(0);

  useEffect(() => {
    setToastHandler((r) => setReq(r));
    return () => setToastHandler(null);
  }, []);

  useEffect(() => {
    if (!req) {
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    // entra
    y.value = withTiming(0, { duration: 220 });
    opacidade.value = withTiming(1, { duration: 220 });
    // sai sozinho após a duração
    timer.current = setTimeout(() => {
      opacidade.value = withTiming(0, { duration: 200 });
      y.value = withTiming(-120, { duration: 200 }, (fim) => {
        if (fim) {
          runOnJS(setReq)(null);
        }
      });
    }, req.duracao);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [req, y, opacidade]);

  const estiloAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacidade.value,
  }));

  if (!req) {
    return null;
  }

  const corTipo: Record<ToastTipo, string> = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
  };

  return (
    <Animated.View
      pointerEvents="none"
      // Anuncia a mensagem no leitor de tela sem roubar o foco (Android). No iOS,
      // o accessibilityRole="alert" abaixo cumpre papel equivalente.
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { top: insets.top + spacing.sm }, estiloAnim]}
    >
      <View
        accessible
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Icon name={ICONE[req.tipo]} size={20} color={corTipo[req.tipo]} />
        <Text style={[styles.msg, { color: colors.textPrimary }]} numberOfLines={2}>
          {req.mensagem}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 480,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    // sombra leve; funciona em web e nativo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  msg: { ...typography.bodySmall, flexShrink: 1 },
});
