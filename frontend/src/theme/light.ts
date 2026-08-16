/**
 * Paleta CLARA (protótipo do redesign — spec 04), baseada na referência Louve:
 * fundo claro, cards brancos, acento AZUL, ícones outline, muito espaço em branco.
 *
 * Isolada de propósito: enquanto o redesign está em avaliação, só as telas do
 * protótipo importam daqui. Aprovado o estilo, isto vira a base do `colors` global.
 */
export const lightColors = {
  // fundo
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F8',

  // marca / ação (azul, como na referência)
  primary: '#3D5AF1',
  primarySoft: '#E7ECFD',
  accent: '#4C6FFF',
  primaryGradient: ['#4C6FFF', '#3D5AF1'] as const,

  // texto
  text: '#1E2340',
  textSecondary: '#667085',
  textMuted: '#98A0B3',
  textInverse: '#FFFFFF',

  border: '#EAEDF5',

  // status
  success: '#16A34A',
  warning: '#D97706',
  error: '#E5484D',
  info: '#3D5AF1',
};

/** Sombras suaves adequadas a fundo claro. */
export const lightShadows = {
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
};
