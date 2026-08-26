import { api } from './api';
import { Aviso } from '@/types';

// Rótulo na UI = "Comunicados"; a rota/entidade no back-end é `aviso`.

export interface SalvarAvisoInput {
  titulo: string;
  corpo?: string | null;
  ministerioId?: number | null;
}

export async function listarAvisos(): Promise<Aviso[]> {
  const { data } = await api.get<Aviso[]>('/avisos');
  return data;
}

export async function contarNaoLidos(): Promise<number> {
  const { data } = await api.get<{ total: number }>('/avisos/nao-lidos');
  return data.total;
}

export async function getAviso(id: number): Promise<Aviso> {
  const { data } = await api.get<Aviso>(`/avisos/${id}`);
  return data;
}

export async function criarAviso(input: SalvarAvisoInput): Promise<Aviso> {
  const { data } = await api.post<Aviso>('/avisos', input);
  return data;
}

export async function atualizarAviso(id: number, input: SalvarAvisoInput): Promise<Aviso> {
  const { data } = await api.put<Aviso>(`/avisos/${id}`, input);
  return data;
}

export async function deletarAviso(id: number): Promise<void> {
  await api.delete(`/avisos/${id}`);
}

export async function marcarLido(id: number): Promise<void> {
  await api.post(`/avisos/${id}/lido`);
}
