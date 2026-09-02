import React, { useEffect } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { spacing, radius } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);
const DURACAO_ENTRADA = 250;

/**
 * Container padrão pra blocos de conteúdo (cultos, membros, itens de lista).
 * Vira Pressable (com leve encolhida ao toque) automaticamente se receber onPress;
 * sempre entra com um fade+subida suave (T-04.7).
 *
 * Entrada e encolher-ao-apertar ficam num único `useAnimatedStyle` (em vez de usar a
 * prop `entering` do Reanimated) de propósito: `entering` é uma layout animation que
 * mexe direto no `transform` por fora do React, e colidia com o `transform` do
 * encolher-ao-apertar se estivessem no mesmo elemento — daí o warning "Property
 * [transform] may be overwritten...". Botar cada animação num elemento (um wrapper só
 * pra entrada, por fora) resolvia o warning mas quebrava qualquer tela que passasse um
 * `style` com `flexDirection: 'row'` esperando que ele organizasse os FILHOS do Card
 * (ex.: avatar + nome + badge lado a lado em Membros/Aniversariantes/Comunicados) — o
 * `style` parava no elemento de fora, que não tem filhos pra organizar, e o de dentro
 * (que tem os filhos) ficava sem `flexDirection`, empilhando tudo na vertical.
 * Com as duas animações num só `useAnimatedStyle`, `style` volta a cair direto no
 * elemento que envolve `children`, e não tem mais dois "donos" de `transform`.
 */
export function Card({ children, onPress, style }: CardProps) {
  const styles = useThemedStyles(criarEstilos);
  const escala = useSharedValue(1);
  const entrada = useSharedValue(0);

  useEffect(() => {
    entrada.value = withTiming(1, { duration: DURACAO_ENTRADA });
  }, [entrada]);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ translateY: (1 - entrada.value) * 12 }, { scale: escala.value }],
  }));

  if (onPress) {
    return (
      <PressableAnimado
        style={[styles.card, style, estiloAnimado]}
        onPress={onPress}
        accessibilityRole="button"
        onPressIn={() => {
          escala.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          escala.value = withTiming(1, { duration: 150 });
        }}
      >
        {children}
      </PressableAnimado>
    );
  }

  return (
    <Animated.View style={[styles.card, style, estiloAnimado]}>
      {children}
    </Animated.View>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
