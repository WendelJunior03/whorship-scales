import { useWindowDimensions } from 'react-native';
import { breakpoints, type Breakpoint } from '@/theme';

export interface ResponsiveInfo {
  /** Largura atual da janela (px), reativa a rotação/resize. */
  width: number;
  /** Breakpoint ativo (o maior cujo mínimo a largura atingiu). */
  ativo: Breakpoint;
  /** < md (celular). */
  isMobile: boolean;
  /** >= md e < lg (tablet retrato). */
  isTablet: boolean;
  /** >= lg (desktop / tablet paisagem) — liga a sidebar. */
  isDesktop: boolean;
  /** Verdadeiro se a largura atual atingiu o mínimo do breakpoint `bp`. */
  acima: (bp: Breakpoint) => boolean;
}

/**
 * Info de responsividade derivada da largura da janela + tokens de breakpoint.
 * Uso: `const { isDesktop } = useBreakpoint();`
 */
export function useBreakpoint(): ResponsiveInfo {
  const { width } = useWindowDimensions();

  const acima = (bp: Breakpoint) => width >= breakpoints[bp];

  let ativo: Breakpoint = 'sm';
  if (width >= breakpoints.xl) ativo = 'xl';
  else if (width >= breakpoints.lg) ativo = 'lg';
  else if (width >= breakpoints.md) ativo = 'md';

  return {
    width,
    ativo,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    acima,
  };
}
