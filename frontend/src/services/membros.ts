import { api } from './api';
import { Membro } from '@/types';

export interface AtualizarMembroInput {
  name: string;
  phone: string;
  instrument: string;
  email: string;
}

/**
 * Dados do próprio usuário logado.
 */
export async function getMeuPerfil(): Promise<Membro> {
  const response = await api.get<Membro>('/membros/me');
  return response.data;
}

/**
 * Lista todos os membros. Só admin.
 */
export async function getTodosMembros(): Promise<Membro[]> {
  const response = await api.get<Membro[]>('/membros');
  return response.data;
}

/**
 * Busca um membro específico. Admin e ministro.
 */
export async function getMembroPorId(id: number): Promise<Membro> {
  const response = await api.get<Membro>(`/membros/${id}`);
  return response.data;
}

/**
 * Atualiza os dados de um membro. O próprio dono do registro, ou admin.
 * Os 4 campos são obrigatórios (o back-end não faz atualização parcial).
 */
export async function atualizarMembro(id: number, input: AtualizarMembroInput): Promise<void> {
  await api.put(`/membros/${id}`, input);
}

/**
 * Desativa (soft delete) um membro. Só admin.
 */
export async function desativarMembro(id: number): Promise<void> {
  await api.delete(`/membros/${id}`);
}
