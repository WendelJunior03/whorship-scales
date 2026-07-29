export type Papel = 'admin' | 'ministro' | 'vocal' | 'membro';

export type DiaSemana = 'quarta' | 'sabado' | 'domingo';

export type StatusEscalaVocal = 'pendente' | 'confirmado' | 'recusado';

export interface Membro {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: Papel;
  instrumento: string | null;
  ativo?: boolean;
}

export interface Culto {
  id: number;
  data_hora: string;
  tipo: string | null;
}

export interface EscalaFixa {
  id: number;
  membro_id: number;
  dia_semana: DiaSemana;
  funcao: string;
  nome?: string;
}

export interface Excecao {
  id: number;
  escala_fixa_id: number;
  data: string;
  substituto_id: number | null;
}

export interface EscalaVocal {
  id: number;
  membro_id: number;
  culto_id: number;
  status: StatusEscalaVocal;
}

export interface Repertorio {
  id: number;
  culto_id: number;
  nome: string;
  tom: string;
  link_musica: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

/**
 * Formato que GET /escala-fixa e GET /escala-fixa/me devolvem —
 * é um JOIN, não a entidade EscalaFixa crua (não tem id nem membro_id).
 */
export interface EscalaFixaMontada {
  dia_semana: DiaSemana;
  funcao: string;
  nome: string;
}

/**
 * Formato de cada item de GET /escala-fixa/efetiva — já considera
 * substituições (excecoes), por isso "quem_toca" pode ser o titular
 * ou o substituto.
 */
export interface EscalaEfetivaItem {
  dia_semana: DiaSemana;
  funcao: string;
  quem_toca: string;
}

/**
 * Formato de cada item de GET /escala-vocal/sugestao. `ultima_vez` é
 * null quando o vocal nunca foi escalado antes (prioridade máxima).
 */
export interface SugestaoVocal {
  id: number;
  nome: string;
  ultima_vez: string | null;
}
