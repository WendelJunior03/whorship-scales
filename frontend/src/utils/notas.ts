/**
 * Conversão frequência ↔ nota musical (spec 09, D-09.3). Referência A4 = 440 Hz.
 * Usa o número MIDI como ponte: nota mais próxima + desvio em cents.
 */
export const A4_HZ = 440;

const NOMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface NotaDetectada {
  /** Nome da nota mais próxima (ex.: 'A', 'C#'). */
  nome: string;
  /** Oitava científica (ex.: 4 em A4). */
  oitava: number;
  /** Rótulo completo (ex.: 'A4'). */
  rotulo: string;
  /** Desvio em cents da nota ideal (−50..+50; 0 = afinado). */
  cents: number;
  /** Frequência ideal da nota mais próxima, em Hz. */
  freqAlvo: number;
  /** Número MIDI da nota mais próxima. */
  midi: number;
}

/** Nome+oitava a partir do número MIDI (60 = C4). */
export function midiParaNome(midi: number): { nome: string; oitava: number; rotulo: string } {
  const nome = NOMES[((midi % 12) + 12) % 12];
  const oitava = Math.floor(midi / 12) - 1;
  return { nome, oitava, rotulo: `${nome}${oitava}` };
}

/** Frequência (Hz) da nota mais próxima + desvio em cents. */
export function freqParaNota(freq: number): NotaDetectada {
  const midiExato = 69 + 12 * Math.log2(freq / A4_HZ);
  const midi = Math.round(midiExato);
  const cents = Math.round((midiExato - midi) * 100);
  const freqAlvo = A4_HZ * Math.pow(2, (midi - 69) / 12);
  const { nome, oitava, rotulo } = midiParaNome(midi);
  return { nome, oitava, rotulo, cents, freqAlvo, midi };
}

/** Frequência (Hz) de um número MIDI — útil pra montar afinações a partir do rótulo. */
export function midiParaFreq(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - 69) / 12);
}
