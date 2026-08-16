/**
 * Paleta CLARA (protótipo do redesign — spec 04).
 *
 * Isolada de propósito: enquanto o redesign claro está em avaliação, só as telas
 * do protótipo importam daqui. Quando o estilo for aprovado, isto vira a base do
 * `colors` global e as demais telas migram.
 */
export const lightColors = {
  // fundo
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EFF6',

  // marca / ação (mantém o roxo como acento)
  primary: '#6C3CE0',
  primarySoft: '#EEE9FC',
  accent: '#8B5CF6',
  primaryGradient: ['#8B5CF6', '#6C3CE0'] as const,

  // texto
  text: '#1B1726',
  textSecondary: '#655F73',
  textMuted: '#9E98AC',
  textInverse: '#FFFFFF',

  border: '#E9E7F1',

  // status
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0EA5E9',
};

/** Sombras suaves adequadas a fundo claro (mais leves que as do tema escuro). */
export const lightShadows = {
  sm: {
    shadowColor: '#1B1726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1B1726',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
};
