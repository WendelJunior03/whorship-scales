import { IconName } from '@/components/Icon';

// Identifica o instrumento pelo nome do arquivo (seção 10 da spec). Ordem importa:
// "backing vocal" antes de "vocal", etc. Retorna rótulo + ícone (linha) pra UI.

interface Regra {
  chaves: string[];
  nome: string;
  icone: IconName;
}

const REGRAS: Regra[] = [
  { chaves: ['backing', 'bvox', 'bvcl', 'bv', 'coro'], nome: 'Backing Vocal', icone: 'mic-vocal-outline' },
  { chaves: ['vocal', 'voz', 'vox', 'lead'], nome: 'Vocal', icone: 'mic-outline' },
  { chaves: ['violao', 'violão', 'acoustic', 'ac gtr', 'nylon'], nome: 'Violão', icone: 'guitar-outline' },
  { chaves: ['guitar', 'guitarra', 'gtr', 'elec'], nome: 'Guitarra', icone: 'guitar-outline' },
  { chaves: ['bass', 'baixo'], nome: 'Baixo', icone: 'guitar-outline' },
  { chaves: ['piano'], nome: 'Piano', icone: 'piano-outline' },
  { chaves: ['key', 'teclado', 'synth', 'pad', 'organ'], nome: 'Teclado', icone: 'piano-outline' },
  { chaves: ['drum', 'bateria', 'kit', 'batera'], nome: 'Bateria', icone: 'drum-outline' },
  { chaves: ['perc', 'shaker', 'conga'], nome: 'Percussão', icone: 'drum-outline' },
  { chaves: ['click', 'metron', 'guia'], nome: 'Click', icone: 'musical-note-outline' },
];

function baseNome(arquivo: string): string {
  return arquivo.replace(/\.[^.]+$/, '').toLowerCase();
}

export function identificarInstrumento(arquivo: string, indice: number): { nome: string; icone: IconName } {
  const base = baseNome(arquivo);
  for (const regra of REGRAS) {
    if (regra.chaves.some((c) => base.includes(c))) {
      return { nome: regra.nome, icone: regra.icone };
    }
  }
  return { nome: `Faixa ${indice + 1}`, icone: 'musical-note-outline' };
}
