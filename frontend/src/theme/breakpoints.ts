/**
 * Breakpoints de layout responsivo (largura da janela em px).
 *
 * Mobile-first: o padrão é o layout de celular (bottom tabs) e, a partir de
 * `lg`, o app passa a mostrar a sidebar fixa no lugar das tabs (ver MainTabs).
 *
 *  - sm  → celular grande
 *  - md  → tablet (retrato)
 *  - lg  → desktop / tablet (paisagem) — a partir daqui liga a sidebar
 *  - xl  → desktop largo
 */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;
