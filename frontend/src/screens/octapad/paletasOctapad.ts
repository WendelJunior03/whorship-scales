/** Cores de acento disponíveis pra personalizar cada pad do Octapad individualmente. */
const CORES_ACENTO: { cor: string; label: string }[] = [
  { cor: '#6366F1', label: 'Índigo' },
  { cor: '#8B5CF6', label: 'Violeta' },
  { cor: '#D946EF', label: 'Fúcsia' },
  { cor: '#F43F5E', label: 'Rosa' },
  { cor: '#F59E0B', label: 'Âmbar' },
  { cor: '#10B981', label: 'Esmeralda' },
  { cor: '#06B6D4', label: 'Ciano' },
];

/** Cor do brilho/LED de um pad ao tocar. `cor: null` = mantém a cor original do instrumento no kit. */
export const PALETA_DESTAQUE: { cor: string | null; label: string }[] = [
  { cor: null, label: 'Padrão' },
  ...CORES_ACENTO,
];
