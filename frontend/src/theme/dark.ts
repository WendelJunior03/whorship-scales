/**
 * Paleta DARK/PRO (protótipo do redesign — spec 04 v2). Inspirada em apps de áudio
 * profissionais: fundo navy quase preto, painéis elevados sutis, acento azul vibrante,
 * texto de alto contraste. Por ora usada só no protótipo (Octapad); no rollout vira o
 * tema global.
 */
export const dark = {
  // Fundo em gradiente sutil (profundidade).
  bgGradient: ['#111A2C', '#0A0F1A'] as const,
  bg: '#0B111C',
  panel: '#141D2E', // cards/seções
  surface: '#1A2740', // controles/pads
  surfaceStrong: '#22345A', // hover/ativo
  border: '#26344E',
  borderStrong: '#33456A',

  primary: '#4C82FF',
  primaryStrong: '#6E9BFF',
  primarySoft: 'rgba(76, 130, 255, 0.16)',
  primaryGlow: 'rgba(76, 130, 255, 0.45)',

  text: '#EAF1FC',
  textSecondary: '#93A1BA',
  textMuted: '#5D6B84',
  textInverse: '#0B111C',

  success: '#3DD68C',
  warning: '#F2B453',
  danger: '#FF5C6C',
};
