export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTAS: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** As 6 camadas do Pad Contínuo (spec 06, D-06.6). `base1` é a única disponível no FREE. */
export type CamadaId = 'base1' | 'base2' | 'base3' | 'atmosfera' | 'reverse' | 'guitarra';

export interface DefinicaoCamada {
  id: CamadaId;
  rotulo: string;
  /** Ponto de partida da mixagem (bases mais altas, texturas mais baixas) — ver D-06.6. */
  volumePadrao: number;
  /** true pra todas exceto `base1` — controla o gate FREE/PRO (D-06.7). */
  somenteNoPro: boolean;
}

/** Estado de uma camada — o que o hook/UI precisam pra renderizar e decidir o que enviar à engine. */
export interface EstadoCamada {
  notaAtiva: Note | null;
  /** 0 a 1. */
  volume: number;
  /** 0 (mais fechado/escuro) a 1 (totalmente aberto) — convertido pra Hz na engine. */
  cutoff: number;
  mudo: boolean;
  solo: boolean;
}
