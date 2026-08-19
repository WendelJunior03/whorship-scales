/** Cores de acento compartilhadas entre as duas paletas (inativo e ativo). */
const CORES_ACENTO: { cor: string; label: string }[] = [
  { cor: '#6366F1', label: 'Índigo' },
  { cor: '#8B5CF6', label: 'Violeta' },
  { cor: '#D946EF', label: 'Fúcsia' },
  { cor: '#F43F5E', label: 'Rosa' },
  { cor: '#F59E0B', label: 'Âmbar' },
  { cor: '#10B981', label: 'Esmeralda' },
  { cor: '#06B6D4', label: 'Ciano' },
];

/** Opções de cor pro pad quando ele está PARADO. `cor: null` = usa o tom padrão do tema. */
export const PALETA_INATIVO: { cor: string | null; label: string }[] = [
  { cor: null, label: 'Padrão' },
  { cor: '#FFFFFF', label: 'Branco' },
  ...CORES_ACENTO,
];

/** Opções de cor pro pad quando ele está TOCANDO. `cor: null` = usa o azul da marca (colors.primary). */
export const PALETA_ATIVO: { cor: string | null; label: string }[] = [
  { cor: null, label: 'Azul' },
  ...CORES_ACENTO,
];
