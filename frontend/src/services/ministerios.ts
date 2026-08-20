import { api } from './api';
import { Ministerio, MinisterioMembro, Funcao, Equipe, Classificacao } from '@/types';

export async function listarMinisterios(): Promise<Ministerio[]> {
  const { data } = await api.get<Ministerio[]>('/ministerios');
  return data;
}

export async function getMinisterio(id: number): Promise<Ministerio> {
  const { data } = await api.get<Ministerio>(`/ministerios/${id}`);
  return data;
}

export async function listarMembros(id: number): Promise<MinisterioMembro[]> {
  const { data } = await api.get<MinisterioMembro[]>(`/ministerios/${id}/membros`);
  return data;
}

export async function listarFuncoes(id: number): Promise<Funcao[]> {
  const { data } = await api.get<Funcao[]>(`/ministerios/${id}/funcoes`);
  return data;
}

export async function listarEquipes(id: number): Promise<Equipe[]> {
  const { data } = await api.get<Equipe[]>(`/ministerios/${id}/equipes`);
  return data;
}

export async function listarClassificacoes(id: number): Promise<Classificacao[]> {
  const { data } = await api.get<Classificacao[]>(`/ministerios/${id}/classificacoes`);
  return data;
}
