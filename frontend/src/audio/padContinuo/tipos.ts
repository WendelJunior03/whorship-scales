export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTAS: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** As 8 camadas do Pad Contínuo. `base1` é a única disponível no FREE. */
export type CamadaId =
  | 'base1'
  | 'base2'
  | 'base3'
  | 'atmosfera'
  | 'shimmer'
  | 'swell'
  | 'reverse'
  | 'guitarra';

export interface DefinicaoCamada {
  id: CamadaId;
  rotulo: string;
  /** Ponto de partida da mixagem (bases mais altas, texturas mais baixas). */
  volumePadrao: number;
  /** true pra todas exceto `base1` — controla o gate FREE/PRO. */
  somenteNoPro: boolean;
}

/**
 * Estado de controle de uma camada. A nota é GLOBAL (uma só, compartilhada por todas as
 * camadas ligadas — decisão do dono do projeto), por isso não mora aqui: `ligada` é o que
 * decide se essa camada está tocando a nota global atual ou não.
 */
export interface EstadoCamada {
  ligada: boolean;
  /** 0 a 1. */
  volume: number;
  /** 0 (mais fechado/escuro) a 1 (totalmente aberto) — convertido pra Hz na engine. */
  cutoff: number;
  mudo: boolean;
  solo: boolean;
}
