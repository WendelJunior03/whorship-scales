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
