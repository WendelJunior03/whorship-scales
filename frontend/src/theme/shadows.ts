import { ViewStyle } from 'react-native';

/**
 * Tokens de sombra do design system (tema claro). Usa as props `shadow*` +
 * `elevation`, que o React Native (nativo) e o RN Web (traduz p/ box-shadow)
 * entendem. Sombras suaves em navy, adequadas a fundo claro.
 */
export const shadows: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: '#1E2340',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E2340',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1E2340',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 12,
  },
};
