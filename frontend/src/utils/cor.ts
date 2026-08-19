function hexParaRgb(hex: string): { r: number; g: number; b: number } {
  const limpo = hex.replace('#', '');
  return {
    r: parseInt(limpo.substring(0, 2), 16),
    g: parseInt(limpo.substring(2, 4), 16),
    b: parseInt(limpo.substring(4, 6), 16),
  };
}

/** Converte hex (#RRGGBB) pra rgba(...) com a opacidade informada (0 a 1). */
export function hexParaRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexParaRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** true se o hex (#RRGGBB) for uma cor clara — usa luminância relativa (fórmula padrão). */
export function corEhClara(hex: string): boolean {
  const { r, g, b } = hexParaRgb(hex);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6;
}

/** Mistura `corA` sobre `corB` na fração informada (0 a 1) — simula o resultado visual de um rgba(corA, fracaoA) sobre um fundo sólido corB. */
export function misturarHex(corA: string, corB: string, fracaoA: number): string {
  const a = hexParaRgb(corA);
  const b = hexParaRgb(corB);
  const r = Math.round(a.r * fracaoA + b.r * (1 - fracaoA));
  const g = Math.round(a.g * fracaoA + b.g * (1 - fracaoA));
  const bl = Math.round(a.b * fracaoA + b.b * (1 - fracaoA));
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
