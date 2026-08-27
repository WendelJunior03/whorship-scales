// Identifica o instrumento pelo nome do arquivo (seção 10 da spec). Ordem importa:
// "backing vocal" antes de "vocal", etc. Retorna rótulo + emoji pra UI.

interface Regra {
  chaves: string[];
  nome: string;
  emoji: string;
}

const REGRAS: Regra[] = [
  { chaves: ['backing', 'bvox', 'bvcl', 'bv', 'coro'], nome: 'Backing Vocal', emoji: '🎤' },
  { chaves: ['vocal', 'voz', 'vox', 'lead'], nome: 'Vocal', emoji: '🎤' },
  { chaves: ['violao', 'violão', 'acoustic', 'ac gtr', 'nylon'], nome: 'Violão', emoji: '🎸' },
  { chaves: ['guitar', 'guitarra', 'gtr', 'elec'], nome: 'Guitarra', emoji: '🎸' },
  { chaves: ['bass', 'baixo'], nome: 'Baixo', emoji: '🎸' },
  { chaves: ['piano'], nome: 'Piano', emoji: '🎹' },
  { chaves: ['key', 'teclado', 'synth', 'pad', 'organ'], nome: 'Teclado', emoji: '🎹' },
  { chaves: ['drum', 'bateria', 'kit', 'batera'], nome: 'Bateria', emoji: '🥁' },
  { chaves: ['perc', 'shaker', 'conga'], nome: 'Percussão', emoji: '🪘' },
  { chaves: ['click', 'metron', 'guia'], nome: 'Click', emoji: '🎧' },
];

/** Remove extensão e normaliza (minúsculo, sem acento em chaves comuns). */
function baseNome(arquivo: string): string {
  return arquivo.replace(/\.[^.]+$/, '').toLowerCase();
}

export function identificarInstrumento(arquivo: string, indice: number): { nome: string; emoji: string } {
  const base = baseNome(arquivo);
  for (const regra of REGRAS) {
    if (regra.chaves.some((c) => base.includes(c))) {
      return { nome: regra.nome, emoji: regra.emoji };
    }
  }
  return { nome: `Faixa ${indice + 1}`, emoji: '🎵' };
}
