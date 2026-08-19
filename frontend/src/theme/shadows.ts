import { ViewStyle } from 'react-native';

/**
 * Tokens de sombra do design system (tema dark). Usa as props `shadow*` +
 * `elevation`, que o React Native (nativo) e o RN Web (traduz p/ box-shadow)
 * entendem. Em fundo escuro, sombras pretas dão profundidade; a separação dos
 * cards também vem das bordas (colors.border).
 */
export const shadows: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
};
