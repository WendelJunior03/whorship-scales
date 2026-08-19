import { ViewStyle } from 'react-native';

/**
 * Paletas dos dois temas (claro/escuro) + sombras. A forma (`Cores`/`Sombras`) é a mesma
 * dos tokens antigos, então as telas trocam `import { colors } from '@/theme'` por
 * `useTheme()`/`useThemedStyles()` (ver contexts/ThemeContext) sem mexer no corpo do estilo.
 */

export interface Cores {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  accent: string;
  primaryGradient: readonly [string, string];
  bgGradient: readonly [string, string];
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  papel: { admin: string; ministro: string; vocal: string; membro: string };
}

export type Sombras = Record<'sm' | 'md' | 'lg', ViewStyle>;

// --- Tema ESCURO (dark/pro) ---
export const paletaEscura: Cores = {
  background: '#0B111C',
  surface: '#141D2E',
  surfaceElevated: '#1A2740',
  surfaceMuted: '#22345A',
  primary: '#4C82FF',
  primaryDark: '#3567E0',
  primaryLight: '#6E9BFF',
  primarySoft: 'rgba(76, 130, 255, 0.16)',
  accent: '#6E9BFF',
  primaryGradient: ['#6E9BFF', '#4C82FF'],
  bgGradient: ['#111A2C', '#0A0F1A'],
  text: '#EAF1FC',
  textPrimary: '#EAF1FC',
  textSecondary: '#93A1BA',
  textMuted: '#5D6B84',
  textInverse: '#FFFFFF',
  border: '#26344E',
  success: '#3DD68C',
  warning: '#F2B453',
  error: '#FF5C6C',
  info: '#4C82FF',
  papel: { admin: '#4C82FF', ministro: '#6E9BFF', vocal: '#22D3EE', membro: '#5D6B84' },
};

export const sombrasEscuras: Sombras = {
  sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 },
  lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.5, shadowRadius: 28, elevation: 12 },
};

// --- Tema CLARO (minimalista, acento azul) ---
export const paletaClara: Cores = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF1F8',
  surfaceMuted: '#EEF1F8',
  primary: '#3D5AF1',
  primaryDark: '#2C43C4',
  primaryLight: '#8AA0FF',
  primarySoft: '#E7ECFD',
  accent: '#4C6FFF',
  primaryGradient: ['#4C6FFF', '#3D5AF1'],
  bgGradient: ['#F4F6FB', '#E9EEFB'],
  text: '#1E2340',
  textPrimary: '#1E2340',
  textSecondary: '#667085',
  textMuted: '#98A0B3',
  textInverse: '#FFFFFF',
  border: '#EAEDF5',
  success: '#16A34A',
  warning: '#D97706',
  error: '#E5484D',
  info: '#3D5AF1',
  papel: { admin: '#3D5AF1', ministro: '#4C6FFF', vocal: '#0EA5E9', membro: '#98A0B3' },
};

export const sombrasClaras: Sombras = {
  sm: { shadowColor: '#1E2340', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#1E2340', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  lg: { shadowColor: '#1E2340', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 12 },
};

export type ModoTema = 'claro' | 'escuro';

export const temas: Record<ModoTema, { colors: Cores; shadows: Sombras }> = {
  claro: { colors: paletaClara, shadows: sombrasClaras },
  escuro: { colors: paletaEscura, shadows: sombrasEscuras },
};
