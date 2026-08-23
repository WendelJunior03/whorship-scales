import { api } from './api';
import { EscalaAvulsaDoCultoItem, MembroCandidato, MinhaEscalaAvulsaItem, StatusEscalaVocal } from '@/types';

export interface CriarEscalaAvulsaInput {
  membroId: number;
  cultoId: number;
  funcao: string;
}

/**
 * Vincula um membro a uma função pontual num culto específico. Admin e
 * ministro. Usado pra cultos fora da rotina fixa (fora de quarta/sábado/
 * domingo), onde escala_fixa não se aplica.
 */
export async function criarEscalaAvulsa(input: CriarEscalaAvulsaInput): Promise<void> {
  await api.post('/escala-avulsa', input);
}

/**
 * Quem está escalado de forma avulsa num culto específico, com nome,
 * função e status de confirmação de cada um.
 */
export async function getEscalaAvulsaDoCulto(cultoId: number): Promise<EscalaAvulsaDoCultoItem[]> {
  const response = await api.get<EscalaAvulsaDoCultoItem[]>(`/escala-avulsa/culto/${cultoId}`);
  return response.data;
}

/**
 * Remove um vínculo avulso da escala de um culto. Admin e ministro.
 */
export async function deletarEscalaAvulsa(id: number): Promise<void> {
  await api.delete(`/escala-avulsa/${id}`);
}

/**
 * Confirma ou recusa a própria presença numa escala avulsa. Só o dono
 * do registro. Ao recusar, dá pra indicar quem poderia substituir
 * (opcional) — o nome vai junto no aviso que o ministério recebe.
 */
export async function confirmarPresencaAvulsa(
  id: number,
  status: StatusEscalaVocal,
  indicadoId?: number,
): Promise<void> {
  await api.put(`/escala-avulsa/${id}/status`, { status, indicadoId });
}

/**
 * Membros ativos que dá pra indicar como substituto num culto específico
 * (exclui quem já está escalado nele e quem está indicando).
 */
export async function getCandidatosAvulsa(cultoId: number): Promise<MembroCandidato[]> {
  const response = await api.get<MembroCandidato[]>('/escala-avulsa/candidatos', {
    params: { cultoId },
  });
  return response.data;
}

/**
 * Todos os compromissos avulsos do usuário logado (passados e futuros),
 * cada um com id, status, função e dados do culto.
 */
export async function getMinhaEscalaAvulsa(): Promise<MinhaEscalaAvulsaItem[]> {
  const response = await api.get<MinhaEscalaAvulsaItem[]>('/escala-avulsa/me');
  return response.data;
}
