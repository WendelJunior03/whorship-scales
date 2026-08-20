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

// --- Membros ---

export async function adicionarMembro(
  id: number,
  membroId: number,
  papel: 'administrador' | 'membro' = 'membro',
): Promise<void> {
  await api.post(`/ministerios/${id}/membros`, { membroId, papel });
}

export async function removerMembro(id: number, membroId: number): Promise<void> {
  await api.delete(`/ministerios/${id}/membros/${membroId}`);
}

// --- Funções ---

export async function criarFuncao(id: number, nome: string, icone?: string | null): Promise<Funcao> {
  const { data } = await api.post<Funcao>(`/ministerios/${id}/funcoes`, { nome, icone: icone ?? null });
  return data;
}

export async function apagarFuncao(id: number, funcaoId: number): Promise<void> {
  await api.delete(`/ministerios/${id}/funcoes/${funcaoId}`);
}

export async function atribuirFuncao(id: number, membroId: number, funcaoId: number): Promise<void> {
  await api.post(`/ministerios/${id}/membro-funcoes`, { membroId, funcaoId });
}

export async function removerFuncaoDoMembro(id: number, membroId: number, funcaoId: number): Promise<void> {
  await api.delete(`/ministerios/${id}/membros/${membroId}/funcoes/${funcaoId}`);
}

// --- Equipes ---

export async function criarEquipe(id: number, nome: string): Promise<Equipe> {
  const { data } = await api.post<Equipe>(`/ministerios/${id}/equipes`, { nome });
  return data;
}

export async function apagarEquipe(id: number, equipeId: number): Promise<void> {
  await api.delete(`/ministerios/${id}/equipes/${equipeId}`);
}

// --- Classificações ---

export async function criarClassificacao(id: number, nome: string, cor?: string | null): Promise<Classificacao> {
  const { data } = await api.post<Classificacao>(`/ministerios/${id}/classificacoes`, { nome, cor: cor ?? null });
  return data;
}

export async function apagarClassificacao(id: number, classificacaoId: number): Promise<void> {
  await api.delete(`/ministerios/${id}/classificacoes/${classificacaoId}`);
}
