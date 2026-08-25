import { api } from './api';
import { EscalaVocalDoCultoItem, MembroCandidato, MinhaEscalaVocalItem, StatusEscalaVocal, SugestaoVocal } from '@/types';

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
 * Sugestão de rodízio pra um culto específico: os 2 vocais que cantaram há
 * mais tempo (ou nunca cantaram), excluindo quem já está escalado nesse
 * culto. É só sugestão — quem decide/grava é o admin/ministro, via
 * criarEscalaVocal. Admin e ministro.
 */
export async function getSugestaoVocais(cultoId: number): Promise<SugestaoVocal[]> {
  const response = await api.get<{ message: string; vocais: SugestaoVocal[] }>(
    '/escala-vocal/sugestao',
    { params: { cultoId } },
  );
  return response.data.vocais;
}

/**
 * Confirma ou recusa a própria presença num culto em que foi escalado
 * como vocal. Só o dono do registro de escala_vocal. Ao recusar, dá pra
 * indicar quem poderia substituir (opcional) — o nome vai junto no aviso
 * que o ministério recebe.
 */
export async function confirmarPresenca(
  id: number,
  status: StatusEscalaVocal,
  indicadoId?: number,
): Promise<void> {
  await api.put(`/escala-vocal/${id}/status`, { status, indicadoId });
}

/**
 * Vocais ativos que dá pra indicar como substituto num culto específico
 * (exclui quem já está escalado nele e quem está indicando). Qualquer
 * membro autenticado — usado na tela de recusa, não só por admin/ministro.
 */
export async function getCandidatosVocais(cultoId: number): Promise<MembroCandidato[]> {
  const response = await api.get<MembroCandidato[]>('/escala-vocal/candidatos', {
    params: { cultoId },
  });
  return response.data;
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

/**
 * Remove um vocal da escala de um culto. Admin e ministro.
 */
export async function deletarEscalaVocal(id: number): Promise<void> {
  await api.delete(`/escala-vocal/${id}`);
}

/** Líder registra a falta de um vocal (status -> 'falta'); notifica o membro. */
export async function registrarFalta(id: number): Promise<void> {
  await api.post(`/escala-vocal/${id}/falta`);
}
