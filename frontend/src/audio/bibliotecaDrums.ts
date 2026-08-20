/**
 * Catálogo da Biblioteca de Drums (recurso PRO `pads.pack_premium`). Sons prontos em
 * `public/drums/*.mp3`, atribuíveis a qualquer um dos 8 pads do Octapad.
 */
export interface SomBiblioteca {
  id: string;
  arquivo: string;
  nome: string;
  categoria: string;
}

export const BIBLIOTECA_DRUMS: SomBiblioteca[] = [
  { id: 'clap-a', arquivo: 'clap-a.mp3', nome: 'Clap A', categoria: 'Clap' },
  { id: 'clap-a1', arquivo: 'clap-a1.mp3', nome: 'Clap A1', categoria: 'Clap' },
  { id: 'clap-d', arquivo: 'clap-d.mp3', nome: 'Clap D', categoria: 'Clap' },
  { id: 'clap-dry-0', arquivo: 'clap-dry-0.mp3', nome: 'Clap Dry 0', categoria: 'Clap' },
  { id: 'clap-dry-1', arquivo: 'clap-dry-1.mp3', nome: 'Clap Dry 1', categoria: 'Clap' },
  { id: 'clap-dry-2', arquivo: 'clap-dry-2.mp3', nome: 'Clap Dry 2', categoria: 'Clap' },
  { id: 'clap-dry-3', arquivo: 'clap-dry-3.mp3', nome: 'Clap Dry 3', categoria: 'Clap' },
  { id: 'clap-rb-1', arquivo: 'clap-rb-1.mp3', nome: 'Clap RB 1', categoria: 'Clap' },
  { id: 'clap-rb-2', arquivo: 'clap-rb-2.mp3', nome: 'Clap RB 2', categoria: 'Clap' },
  { id: 'clap-rb-3', arquivo: 'clap-rb-3.mp3', nome: 'Clap RB 3', categoria: 'Clap' },
  { id: 'clap-rb-4', arquivo: 'clap-rb-4.mp3', nome: 'Clap RB 4', categoria: 'Clap' },
  { id: 'clap-rb-5', arquivo: 'clap-rb-5.mp3', nome: 'Clap RB 5', categoria: 'Clap' },
  { id: 'clap-w', arquivo: 'clap-w.mp3', nome: 'Clap W', categoria: 'Clap' },
  { id: 'snap-verb-2', arquivo: 'snap-verb-2.mp3', nome: 'Snap Verb 2', categoria: 'Clap' },
  { id: 'chimes-1', arquivo: 'chimes-1.mp3', nome: 'Chimes 1', categoria: 'Efeitos/Crescendo' },
  { id: 'chimes-2', arquivo: 'chimes-2.mp3', nome: 'Chimes 2', categoria: 'Efeitos/Crescendo' },
  { id: 'chimes-3', arquivo: 'chimes-3.mp3', nome: 'Chimes 3', categoria: 'Efeitos/Crescendo' },
  { id: 'cond-cres-1', arquivo: 'cond-cres-1.mp3', nome: 'Cond Cres 1', categoria: 'Efeitos/Crescendo' },
  { id: 'cond-cres-2', arquivo: 'cond-cres-2.mp3', nome: 'Cond Cres 2', categoria: 'Efeitos/Crescendo' },
  { id: 'cymbal-cres-1', arquivo: 'cymbal-cres-1.mp3', nome: 'Cymbal Cres 1', categoria: 'Efeitos/Crescendo' },
  { id: 'cymbal-cres-2', arquivo: 'cymbal-cres-2.mp3', nome: 'Cymbal Cres 2', categoria: 'Efeitos/Crescendo' },
  { id: 'sweep-2', arquivo: 'sweep-2.mp3', nome: 'Sweep 2', categoria: 'Efeitos/Crescendo' },
  { id: 'hat-fast-1', arquivo: 'hat-fast-1.mp3', nome: 'Hat Fast 1', categoria: 'Hi-hat' },
  { id: 'hat-fast-2', arquivo: 'hat-fast-2.mp3', nome: 'Hat Fast 2', categoria: 'Hi-hat' },
  { id: 'hat-fast-3', arquivo: 'hat-fast-3.mp3', nome: 'Hat Fast 3', categoria: 'Hi-hat' },
  { id: 'kick-1', arquivo: 'kick-1.mp3', nome: 'Kick 1', categoria: 'Kick' },
  { id: 'kick-boom-1', arquivo: 'kick-boom-1.mp3', nome: 'Kick Boom 1', categoria: 'Kick' },
  { id: 'kick-boom-2', arquivo: 'kick-boom-2.mp3', nome: 'Kick Boom 2', categoria: 'Kick' },
  { id: 'kick-boom-3', arquivo: 'kick-boom-3.mp3', nome: 'Kick Boom 3', categoria: 'Kick' },
  { id: 'kick-boom-4', arquivo: 'kick-boom-4.mp3', nome: 'Kick Boom 4', categoria: 'Kick' },
  { id: 'kick-boom-5', arquivo: 'kick-boom-5.mp3', nome: 'Kick Boom 5', categoria: 'Kick' },
  { id: 'kick-boom-6', arquivo: 'kick-boom-6.mp3', nome: 'Kick Boom 6', categoria: 'Kick' },
  { id: 'kick-boom-a', arquivo: 'kick-boom-a.mp3', nome: 'Kick Boom A', categoria: 'Kick' },
  { id: 'kick-rb1', arquivo: 'kick-rb1.mp3', nome: 'Kick RB1', categoria: 'Kick' },
  { id: 'big-box', arquivo: 'big-box.mp3', nome: 'Big Box', categoria: 'Outros' },
  { id: 'clank-rb-1', arquivo: 'clank-rb-1.mp3', nome: 'Clank RB 1', categoria: 'Outros' },
  { id: 'fx-perc-01-1', arquivo: 'fx-perc-01-1.mp3', nome: 'FX Perc 01 1', categoria: 'Outros' },
  { id: 'low-1', arquivo: 'low-1.mp3', nome: 'Low 1', categoria: 'Outros' },
  { id: 'low-2', arquivo: 'low-2.mp3', nome: 'Low 2', categoria: 'Outros' },
  { id: 'low-3', arquivo: 'low-3.mp3', nome: 'Low 3', categoria: 'Outros' },
  { id: 'low-4', arquivo: 'low-4.mp3', nome: 'Low 4', categoria: 'Outros' },
  { id: 'low-5', arquivo: 'low-5.mp3', nome: 'Low 5', categoria: 'Outros' },
  { id: 'stall-1', arquivo: 'stall-1.mp3', nome: 'Stall 1', categoria: 'Outros' },
  { id: 'stall-2', arquivo: 'stall-2.mp3', nome: 'Stall 2', categoria: 'Outros' },
  { id: 'tambourin-1', arquivo: 'tambourin-1.mp3', nome: 'Tambourin 1', categoria: 'Pandeiro' },
  { id: 'tambourin-2', arquivo: 'tambourin-2.mp3', nome: 'Tambourin 2', categoria: 'Pandeiro' },
  { id: 'tambourin-3', arquivo: 'tambourin-3.mp3', nome: 'Tambourin 3', categoria: 'Pandeiro' },
  { id: 'tambourin-4', arquivo: 'tambourin-4.mp3', nome: 'Tambourin 4', categoria: 'Pandeiro' },
  { id: 'tambourin-5', arquivo: 'tambourin-5.mp3', nome: 'Tambourin 5', categoria: 'Pandeiro' },
  { id: 'tambourin-n', arquivo: 'tambourin-n.mp3', nome: 'Tambourin N', categoria: 'Pandeiro' },
  { id: 'tambourin-n2', arquivo: 'tambourin-n2.mp3', nome: 'Tambourin N2', categoria: 'Pandeiro' },
  { id: 'tambourin-sweel', arquivo: 'tambourin-sweel.mp3', nome: 'Tambourin Sweel', categoria: 'Pandeiro' },
  { id: 'shaker-1', arquivo: 'shaker-1.mp3', nome: 'Shaker 1', categoria: 'Shaker' },
  { id: 'shaker-2', arquivo: 'shaker-2.mp3', nome: 'Shaker 2', categoria: 'Shaker' },
  { id: 'shaker-3', arquivo: 'shaker-3.mp3', nome: 'Shaker 3', categoria: 'Shaker' },
  { id: 'shsker-1', arquivo: 'shsker-1.mp3', nome: 'Shaker 4', categoria: 'Shaker' },
  { id: 'snare-70', arquivo: 'snare-70.mp3', nome: 'Snare 70', categoria: 'Snare' },
  { id: 'snare-verb-2', arquivo: 'snare-verb-2.mp3', nome: 'Snare Verb 2', categoria: 'Snare' },
];

export const CATEGORIAS_BIBLIOTECA_DRUMS = BIBLIOTECA_DRUMS.reduce<string[]>((acc, s) => {
  if (!acc.includes(s.categoria)) acc.push(s.categoria);
  return acc;
}, []);
