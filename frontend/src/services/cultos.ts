import { api } from './api';
import { Culto } from '@/types';

export interface CriarCultoInput {
  dataHora: string;
  tipo?: string | null;
}

/**
 * Busca um culto específico por id.
 */
export async function getCultoById(id: number): Promise<Culto> {
  const response = await api.get<Culto>(`/cultos/${id}`);
  return response.data;
}

/**
 * Cadastra um culto novo. Só admin — usado principalmente pra cultos
 * fora da rotina fixa (fora de quarta/sábado/domingo).
 */
export async function criarCulto(input: CriarCultoInput): Promise<Culto> {
  const response = await api.post<Culto>('/cultos', input);
  return response.data;
}

/**
 * Lista todos os cultos cadastrados. Admin e ministro.
 */
export async function getTodosCultos(): Promise<Culto[]> {
  const response = await api.get<Culto[]>('/cultos');
  return response.data;
}

/**
 * Apaga um culto e tudo que depende dele (repertório, escala de vocal e
 * avulsa vinculados). Só admin. Sem volta.
 */
export async function deletarCulto(id: number): Promise<void> {
  await api.delete(`/cultos/${id}`);
}
