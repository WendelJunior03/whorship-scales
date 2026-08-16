// Tema CLARO/minimalista (referência Louve) — acento AZUL.
export const colors = {
  // fundo
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF1F8',
  surfaceMuted: '#EEF1F8',

  // marca / ação
  primary: '#3D5AF1',
  primaryDark: '#2C43C4',
  primaryLight: '#8AA0FF',
  primarySoft: '#E7ECFD',
  accent: '#4C6FFF',
  primaryGradient: ['#4C6FFF', '#3D5AF1'] as const,

  // texto
  text: '#1E2340',
  textPrimary: '#1E2340',
  textSecondary: '#667085',
  textMuted: '#98A0B3',
  textInverse: '#FFFFFF',

  border: '#EAEDF5',

  // status / feedback
  success: '#16A34A',
  warning: '#D97706',
  error: '#E5484D',
  info: '#3D5AF1',

  // badges de papel
  papel: {
    admin: '#3D5AF1',
    ministro: '#4C6FFF',
    vocal: '#0EA5E9',
    membro: '#98A0B3',
  },
};
