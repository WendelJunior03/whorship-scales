/**
 * Saudação baseada na hora atual do aparelho — "Bom dia" / "Boa tarde" / "Boa noite".
 */
export function getSaudacao(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
