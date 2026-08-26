import { api } from './api';
import { RoteiroItem } from '@/types';

export interface CriarRoteiroInput {
  cultoId: number;
  tipo: 'musica' | 'momento';
  titulo: string;
  tom?: string | null;
  duracaoSeg?: number | null;
  linkMusica?: string | null;
}

export async function listarRoteiro(cultoId: number): Promise<RoteiroItem[]> {
  const { data } = await api.get<RoteiroItem[]>(`/roteiro/culto/${cultoId}`);
  return data;
}

export async function criarItem(input: CriarRoteiroInput): Promise<RoteiroItem> {
  const { data } = await api.post<RoteiroItem>('/roteiro', input);
  return data;
}

export async function atualizarItem(
  id: number,
  campos: { titulo?: string; tom?: string | null; duracaoSeg?: number | null },
): Promise<RoteiroItem> {
  const { data } = await api.put<RoteiroItem>(`/roteiro/${id}`, campos);
  return data;
}

export async function deletarItem(id: number): Promise<void> {
  await api.delete(`/roteiro/${id}`);
}

export async function reordenar(cultoId: number, ids: number[]): Promise<RoteiroItem[]> {
  const { data } = await api.put<RoteiroItem[]>(`/roteiro/culto/${cultoId}/ordem`, { ids });
  return data;
}
