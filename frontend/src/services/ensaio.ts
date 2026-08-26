import { api } from './api';
import { EnsaioDoCulto, MinhaParticipacaoEnsaio, StatusEscalaVocal } from '@/types';

export interface CriarEnsaioInput {
  cultoId: number;
  dataHora: string;
  observacoes?: string | null;
}

export interface AtualizarEnsaioInput {
  dataHora: string;
  observacoes?: string | null;
}

/**
 * Cria o ensaio de um culto (zero ou um por culto — repetir dá erro).
 * Admin e ministro.
 */
export async function criarEnsaio(input: CriarEnsaioInput): Promise<void> {
  await api.post('/ensaios', input);
}

/**
 * Ensaio de um culto específico (ou `ensaio: null` se ainda não foi
 * criado — normal, o culto funciona sem ensaio) junto com os
 * participantes já convidados.
 */
export async function getEnsaioDoCulto(cultoId: number): Promise<EnsaioDoCulto> {
  const response = await api.get<EnsaioDoCulto>(`/ensaios/culto/${cultoId}`);
  return response.data;
}

/**
 * Edita data/hora e observações do ensaio. Admin e ministro.
 */
export async function atualizarEnsaio(id: number, input: AtualizarEnsaioInput): Promise<void> {
  await api.put(`/ensaios/${id}`, input);
}

/**
 * Remove o ensaio (e os participantes dele). Admin e ministro.
 */
export async function excluirEnsaio(id: number): Promise<void> {
  await api.delete(`/ensaios/${id}`);
}

/**
 * Convida um membro pro ensaio (notificação + presença pendente).
 * Admin e ministro.
 */
export async function adicionarParticipante(ensaioId: number, membroId: number): Promise<void> {
  await api.post(`/ensaios/${ensaioId}/participantes`, { membroId });
}

/**
 * Remove um participante do ensaio. Admin e ministro.
 */
export async function removerParticipante(id: number): Promise<void> {
  await api.delete(`/ensaios/participantes/${id}`);
}

/**
 * Confirma ou recusa a própria presença no ensaio. Só o dono do registro.
 */
export async function confirmarPresencaEnsaio(id: number, status: StatusEscalaVocal): Promise<void> {
  await api.put(`/ensaios/participantes/${id}/status`, { status });
}

/** Líder registra a falta de um participante (status -> 'falta'); notifica o membro. */
export async function registrarFaltaEnsaio(id: number): Promise<void> {
  await api.post(`/ensaios/participantes/${id}/falta`);
}

/**
 * Todos os ensaios em que o usuário logado foi convidado (passados e
 * futuros), cada um com id da participação, status e dados do ensaio.
 */
export async function getMinhasParticipacoesEnsaio(): Promise<MinhaParticipacaoEnsaio[]> {
  const response = await api.get<MinhaParticipacaoEnsaio[]>('/ensaios/participantes/me');
  return response.data;
}
