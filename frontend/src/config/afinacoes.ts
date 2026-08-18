/**
 * Afinações por instrumento (spec 09, D-09.3). v1: padrão de violão/guitarra/baixo/
 * ukulele liberadas; afinações alternativas (drop D, meio-tom) marcadas como PRO
 * (recurso 'afinador.avancado') — liberadas na v1 pelo gating (spec 03).
 * Frequências em Hz (referência A4 = 440).
 */

export interface Corda {
  /** Rótulo da corda/nota (ex.: 'E2'). */
  rotulo: string;
  /** Frequência ideal em Hz. */
  freq: number;
}

export interface Afinacao {
  id: string;
  nome: string;
  instrumento: 'violao' | 'guitarra' | 'baixo' | 'ukulele';
  cordas: Corda[];
  /** Afinação avançada → mostra selo PRO (recurso 'afinador.avancado'). */
  pro?: boolean;
}

/** Chave de recurso PRO das afinações avançadas (espelha o catálogo — spec 03). */
export const RECURSO_AFINADOR_AVANCADO = 'afinador.avancado';

export const AFINACOES: Afinacao[] = [
  {
    id: 'violao-padrao',
    nome: 'Violão · Padrão (EADGBE)',
    instrumento: 'violao',
    cordas: [
      { rotulo: 'E2', freq: 82.41 },
      { rotulo: 'A2', freq: 110.0 },
      { rotulo: 'D3', freq: 146.83 },
      { rotulo: 'G3', freq: 196.0 },
      { rotulo: 'B3', freq: 246.94 },
      { rotulo: 'E4', freq: 329.63 },
    ],
  },
  {
    id: 'guitarra-padrao',
    nome: 'Guitarra · Padrão (EADGBE)',
    instrumento: 'guitarra',
    cordas: [
      { rotulo: 'E2', freq: 82.41 },
      { rotulo: 'A2', freq: 110.0 },
      { rotulo: 'D3', freq: 146.83 },
      { rotulo: 'G3', freq: 196.0 },
      { rotulo: 'B3', freq: 246.94 },
      { rotulo: 'E4', freq: 329.63 },
    ],
  },
  {
    id: 'baixo-padrao',
    nome: 'Baixo · Padrão (EADG)',
    instrumento: 'baixo',
    cordas: [
      { rotulo: 'E1', freq: 41.2 },
      { rotulo: 'A1', freq: 55.0 },
      { rotulo: 'D2', freq: 73.42 },
      { rotulo: 'G2', freq: 98.0 },
    ],
  },
  {
    id: 'ukulele-padrao',
    nome: 'Ukulele · Padrão (GCEA)',
    instrumento: 'ukulele',
    cordas: [
      { rotulo: 'G4', freq: 392.0 },
      { rotulo: 'C4', freq: 261.63 },
      { rotulo: 'E4', freq: 329.63 },
      { rotulo: 'A4', freq: 440.0 },
    ],
  },
  // --- Avançadas (PRO) ---
  {
    id: 'violao-drop-d',
    nome: 'Violão · Drop D (DADGBE)',
    instrumento: 'violao',
    pro: true,
    cordas: [
      { rotulo: 'D2', freq: 73.42 },
      { rotulo: 'A2', freq: 110.0 },
      { rotulo: 'D3', freq: 146.83 },
      { rotulo: 'G3', freq: 196.0 },
      { rotulo: 'B3', freq: 246.94 },
      { rotulo: 'E4', freq: 329.63 },
    ],
  },
  {
    id: 'violao-meio-tom',
    nome: 'Violão · Meio-tom abaixo (Eb)',
    instrumento: 'violao',
    pro: true,
    cordas: [
      { rotulo: 'D#2', freq: 77.78 },
      { rotulo: 'G#2', freq: 103.83 },
      { rotulo: 'C#3', freq: 138.59 },
      { rotulo: 'F#3', freq: 185.0 },
      { rotulo: 'A#3', freq: 233.08 },
      { rotulo: 'D#4', freq: 311.13 },
    ],
  },
];

/** Dado um Hz detectado, retorna a corda mais próxima da afinação (menor |cents|). */
export function cordaMaisProxima(afinacao: Afinacao, freq: number): Corda {
  return afinacao.cordas.reduce((melhor, corda) =>
    Math.abs(1200 * Math.log2(freq / corda.freq)) <
    Math.abs(1200 * Math.log2(freq / melhor.freq))
      ? corda
      : melhor,
  );
}
