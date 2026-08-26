import { api } from './api';
import { Indisponibilidade, PeriodoIndisp, RecorrenciaIndisp } from '@/types';

export interface SalvarIndispInput {
  membroId?: number;
  ministerioId?: number | null;
  descricao?: string | null;
  periodo: PeriodoIndisp;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  recorrencia?: RecorrenciaIndisp;
}

export async function listarMinhas(): Promise<Indisponibilidade[]> {
  const { data } = await api.get<Indisponibilidade[]>('/indisponibilidades/me');
  return data;
}

export async function listarPorMembro(membroId: number): Promise<Indisponibilidade[]> {
  const { data } = await api.get<Indisponibilidade[]>(`/indisponibilidades/membro/${membroId}`);
  return data;
}

export async function listarPorMinisterio(ministerioId: number): Promise<Indisponibilidade[]> {
  const { data } = await api.get<Indisponibilidade[]>(
    `/indisponibilidades/ministerio/${ministerioId}`,
  );
  return data;
}

export async function criar(input: SalvarIndispInput): Promise<Indisponibilidade> {
  const { data } = await api.post<Indisponibilidade>('/indisponibilidades', input);
  return data;
}

export async function atualizar(
  id: number,
  input: SalvarIndispInput,
): Promise<Indisponibilidade> {
  const { data } = await api.put<Indisponibilidade>(`/indisponibilidades/${id}`, input);
  return data;
}

export async function deletar(id: number): Promise<void> {
  await api.delete(`/indisponibilidades/${id}`);
}
