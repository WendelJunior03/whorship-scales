// Tema DARK/PRO (referência de apps de áudio profissionais) — acento AZUL.
// Base do design system: todas as telas consomem estes tokens, então trocar aqui
// vira o app inteiro. Cores de "instrumento" (borracha do pad etc.) ficam locais.
export const colors = {
  // fundo
  background: '#0B111C',
  surface: '#141D2E', // cards / seções
  surfaceElevated: '#1A2740', // controles / inputs / pads
  surfaceMuted: '#22345A', // hover / ativo

  // marca / ação
  primary: '#4C82FF',
  primaryDark: '#3567E0',
  primaryLight: '#6E9BFF',
  primarySoft: 'rgba(76, 130, 255, 0.16)',
  accent: '#6E9BFF',
  primaryGradient: ['#6E9BFF', '#4C82FF'] as const,
  bgGradient: ['#111A2C', '#0A0F1A'] as const,

  // texto
  text: '#EAF1FC',
  textPrimary: '#EAF1FC',
  textSecondary: '#93A1BA',
  textMuted: '#5D6B84',
  textInverse: '#FFFFFF',

  border: '#26344E',

  // status / feedback
  success: '#3DD68C',
  warning: '#F2B453',
  error: '#FF5C6C',
  info: '#4C82FF',

  // badges de papel
  papel: {
    admin: '#4C82FF',
    ministro: '#6E9BFF',
    vocal: '#22D3EE',
    membro: '#5D6B84',
  },
};
