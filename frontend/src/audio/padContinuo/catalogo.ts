import { CamadaId, DefinicaoCamada } from './tipos';

/**
 * As 8 camadas. Volumes padrão são ponto de partida — ajustar por ouvido quando as
 * gravações reais chegarem, não é um valor final travado em código.
 */
export const CAMADAS: DefinicaoCamada[] = [
  { id: 'base1', rotulo: 'Base 1', volumePadrao: 0.85, somenteNoPro: false },
  { id: 'base2', rotulo: 'Base 2', volumePadrao: 0.75, somenteNoPro: true },
  { id: 'base3', rotulo: 'Base 3', volumePadrao: 0.65, somenteNoPro: true },
  { id: 'atmosfera', rotulo: 'Atmos', volumePadrao: 0.45, somenteNoPro: true },
  { id: 'shimmer', rotulo: 'Shimmer', volumePadrao: 0.4, somenteNoPro: true },
  { id: 'swell', rotulo: 'Swell', volumePadrao: 0.4, somenteNoPro: true },
  { id: 'reverse', rotulo: 'Reverse', volumePadrao: 0.4, somenteNoPro: true },
  { id: 'guitarra', rotulo: 'Guitar', volumePadrao: 0.5, somenteNoPro: true },
];

/** Camadas visíveis pro plano atual — FREE só vê `base1`. */
export function camadasDisponiveis(pro: boolean): DefinicaoCamada[] {
  return pro ? CAMADAS : CAMADAS.filter((camada) => !camada.somenteNoPro);
}

export function definicaoDaCamada(id: CamadaId): DefinicaoCamada {
  const def = CAMADAS.find((camada) => camada.id === id);
  if (!def) throw new Error(`Camada desconhecida: ${id}`);
  return def;
}
