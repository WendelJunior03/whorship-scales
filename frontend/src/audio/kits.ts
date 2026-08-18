/**
 * Kit de pads embarcado da v1 (spec 05). Cada pad: id, nome, categoria, cor e a função
 * que sintetiza seu buffer. Compatível com `Amostra` do motor (id + render).
 */
import { Amostra } from './motor';
import * as s from './sintese';

export interface PadDef extends Amostra {
  nome: string;
  categoria: string;
  cor: string;
}

export const KIT_PADRAO: PadDef[] = [
  { id: 'bumbo', nome: 'Bumbo', categoria: 'Bateria', cor: '#3D5AF1', render: s.bumbo },
  { id: 'caixa', nome: 'Caixa', categoria: 'Bateria', cor: '#4C6FFF', render: s.caixa },
  { id: 'chimbal', nome: 'Chimbal', categoria: 'Bateria', cor: '#0EA5E9', render: s.chimbal },
  { id: 'chimbal-aberto', nome: 'Chimbal aberto', categoria: 'Bateria', cor: '#06B6D4', render: s.chimbalAberto },
  { id: 'tom', nome: 'Tom', categoria: 'Bateria', cor: '#6366F1', render: s.tom },
  { id: 'clap', nome: 'Clap', categoria: 'Percussão', cor: '#F59E0B', render: s.clap },
  { id: 'clave', nome: 'Clave', categoria: 'Percussão', cor: '#10B981', render: s.clave },
  { id: 'cowbell', nome: 'Cowbell', categoria: 'Percussão', cor: '#EC4899', render: s.cowbell },
];

/** Categorias na ordem de exibição (únicas, preservando a ordem do kit). */
export const CATEGORIAS = KIT_PADRAO.reduce<string[]>((acc, p) => {
  if (!acc.includes(p.categoria)) {
    acc.push(p.categoria);
  }
  return acc;
}, []);
