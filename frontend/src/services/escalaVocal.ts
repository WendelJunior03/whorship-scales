import { api } from './api';
import { EscalaVocalDoCultoItem, MinhaEscalaVocalItem, StatusEscalaVocal, SugestaoVocal } from '@/types';

export interface CriarEscalaVocalInput {
  membroId: number;
  cultoId: number;
}

/**
 * Vincula um vocal a um culto. Admin e ministro. A combinação
 * membroId+cultoId é única — repetir dá erro.
 */
export async function criarEscalaVocal(input: CriarEscalaVocalInput): Promise<void> {
  await api.post('/escala-vocal', input);
}

/**
 * Sugestão de rodízio: os 2 vocais que cantaram há mais tempo (ou nunca
 * cantaram). É só sugestão — quem decide/grava é o admin/ministro, via
 * criarEscalaVocal. Admin e ministro.
 */
export async function getSugestaoVocais(): Promise<SugestaoVocal[]> {
  const response = await api.get<{ message: string; vocais: SugestaoVocal[] }>(
    '/escala-vocal/sugestao',
  );
  return response.data.vocais;
}

/**
 * Confirma ou recusa a própria presença num culto em que foi escalado
 * como vocal. Só o dono do registro de escala_vocal.
 */
export async function confirmarPresenca(id: number, status: StatusEscalaVocal): Promise<void> {
  await api.put(`/escala-vocal/${id}/status`, { status });
}

/**
 * Todos os compromissos de vocal do usuário logado (passados e
 * futuros), cada um com id, status e dados do culto.
 */
export async function getMinhaEscalaVocal(): Promise<MinhaEscalaVocalItem[]> {
  const response = await api.get<MinhaEscalaVocalItem[]>('/escala-vocal/me');
  return response.data;
}

/**
 * Quem está escalado como vocal num culto específico, com nome e status
 * de confirmação de cada um.
 */
export async function getEscalaVocalDoCulto(cultoId: number): Promise<EscalaVocalDoCultoItem[]> {
  const response = await api.get<EscalaVocalDoCultoItem[]>(`/escala-vocal/culto/${cultoId}`);
  return response.data;
}
