export type Papel = 'admin' | 'ministro' | 'vocal' | 'membro';

/** Eixo organizacional (permissões) — spec 02. */
export type PapelOrg = 'administrador' | 'lider' | 'membro';
/** Eixo musical (escalas) — spec 02. Pode ser null. */
export type PapelMinisterio = 'ministro' | 'vocal' | 'instrumentista';

export type PlanoOrg = 'free' | 'pro';

export interface Organizacao {
  id: number;
  nome: string;
  codigo?: string;
  slug?: string;
  plano?: PlanoOrg;
  criado_por?: number | null;
  created_at?: string;
}

// --- Biblioteca de vídeos (spec 08) ---

export type CategoriaVideo = 'oficial' | 'playback' | 'tutorial' | 'ministracao';

export interface Musica {
  id: number;
  nome: string;
  tom_padrao: string | null;
  bpm: number | null;
  created_at?: string;
}

export interface Video {
  id: number;
  musica_id: number;
  provider: string;
  video_id: string;
  categoria: CategoriaVideo;
  titulo: string | null;
  adicionado_por?: number | null;
  created_at?: string;
  /** Presente em GET /videos (lista geral, com JOIN na música). */
  musica_nome?: string;
}

export type StatusEscalaVocal = 'pendente' | 'confirmado' | 'recusado' | 'falta';

export interface Membro {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  papel: Papel;
  /** Eixo organizacional (permissões) — spec 02. */
  papel_org?: PapelOrg;
  /** Eixo musical (escalas) — spec 02. */
  papel_ministerio?: PapelMinisterio | null;
  instrumentos: string[];
  ativo?: boolean;
}

export interface Culto {
  id: number;
  data_hora: string;
  tipo: string | null;
}

// --- Ministérios (spec 11, módulo 1) ---

export type PapelNoMinisterio = 'administrador' | 'membro';

export interface Ministerio {
  id: number;
  org_id?: number;
  nome: string;
  descricao: string | null;
  vagas_gratis: number;
  vagas_extras: number;
  /** Presentes em GET /ministerios (lista) e GET /ministerios/:id. */
  total_membros?: number;
  vagas_total?: number;
  created_at?: string;
}

export interface MinisterioMembro {
  /** id do membro. */
  id: number;
  nome: string;
  email: string;
  papel: PapelNoMinisterio;
  funcoes: string[];
  classificacoes: string[];
  created_at?: string;
}

/** Membro dentro de uma equipe (subconjunto de dados). */
export interface EquipeMembro {
  id: number;
  nome: string;
  email: string;
}

export interface Funcao {
  id: number;
  ministerio_id: number;
  nome: string;
  icone: string | null;
}

export interface Equipe {
  id: number;
  ministerio_id: number;
  nome: string;
  total_membros?: number;
}

export interface Classificacao {
  id: number;
  ministerio_id: number;
  nome: string;
  cor: string | null;
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

/** Ensaio vinculado 1:1 a um culto — opcional, criação manual. */
export interface Ensaio {
  id: number;
  culto_id: number;
  data_hora: string;
  observacoes: string | null;
}

export interface EnsaioParticipante {
  id: number;
  membro_id: number;
  nome: string;
  status: StatusEscalaVocal;
}

export interface EnsaioDoCulto {
  ensaio: Ensaio | null;
  participantes: EnsaioParticipante[];
}

/** Uma participação (minha) num ensaio, já com os dados do ensaio embutidos. */
export interface MinhaParticipacaoEnsaio {
  id: number;
  status: StatusEscalaVocal;
  ensaio_id: number;
  data_hora: string;
  observacoes: string | null;
  culto_id: number;
}

export interface LoginResponse {
  token: string;
  message: string;
}

/**
 * Formato de cada item de GET /escala-vocal/me — os compromissos de
 * vocal do usuário logado, já com o culto e o status de confirmação.
 */
export interface MinhaEscalaVocalItem {
  id: number;
  status: StatusEscalaVocal;
  culto_id: number;
  data_hora: string;
  tipo: string | null;
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

/** Membro que dá pra indicar como substituto ao recusar uma escala. */
export interface MembroCandidato {
  id: number;
  nome: string;
}

/**
 * Formato de cada item de GET /escala-vocal/culto/:cultoId — quem está
 * escalado como vocal num culto específico, com nome já resolvido via JOIN.
 */
export interface EscalaVocalDoCultoItem {
  id: number;
  membro_id: number;
  nome: string;
  status: StatusEscalaVocal;
}

/**
 * Escala "avulsa": vínculo pontual membro + culto + função, pra cobrir
 * qualquer culto (não tem rotina fixa por dia da semana).
 */
export interface EscalaAvulsaDoCultoItem {
  id: number;
  membro_id: number;
  nome: string;
  funcao: string;
  status: StatusEscalaVocal;
}

/**
 * Formato de cada item de GET /escala-avulsa/me — os compromissos
 * avulsos do usuário logado, já com o culto e a função.
 */
export interface MinhaEscalaAvulsaItem {
  id: number;
  status: StatusEscalaVocal;
  culto_id: number;
  data_hora: string;
  tipo: string | null;
  funcao: string;
}

/**
 * Tipos de notificação que o back-end gera hoje. 'repertorio' e
 * 'lembrete' ainda não têm gatilho — reservados pro futuro.
 */
export type TipoNotificacao =
  | 'escala'
  | 'substituicao'
  | 'confirmacao'
  | 'falta'
  | 'repertorio'
  | 'ensaio'
  | 'lembrete';

/**
 * Formato de cada item de GET /notificacoes/me.
 */
export interface Notificacao {
  id: number;
  membro_id: number;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  lida: boolean;
  created_at: string;
  culto_id: number | null;
  referencia_tipo: 'escala_vocal' | 'escala_avulsa' | 'ensaio_participante' | null;
  referencia_id: number | null;
}
