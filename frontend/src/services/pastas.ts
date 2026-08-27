import { api } from './api';
import { Pasta, Musica } from '@/types';

export async function listarPastas(): Promise<Pasta[]> {
  const { data } = await api.get<Pasta[]>('/pastas');
  return data;
}

export async function listarMusicasDaPasta(pastaId: number): Promise<Musica[]> {
  const { data } = await api.get<Musica[]>(`/pastas/${pastaId}/musicas`);
  return data;
}

export async function criarPasta(nome: string, ministerioId?: number | null): Promise<Pasta> {
  const { data } = await api.post<Pasta>('/pastas', { nome, ministerioId });
  return data;
}

export async function renomearPasta(id: number, nome: string): Promise<Pasta> {
  const { data } = await api.put<Pasta>(`/pastas/${id}`, { nome });
  return data;
}

export async function apagarPasta(id: number): Promise<void> {
  await api.delete(`/pastas/${id}`);
}

export async function adicionarMusica(pastaId: number, musicaId: number): Promise<Musica[]> {
  const { data } = await api.post<Musica[]>(`/pastas/${pastaId}/musicas`, { musicaId });
  return data;
}

export async function removerMusica(pastaId: number, musicaId: number): Promise<void> {
  await api.delete(`/pastas/${pastaId}/musicas/${musicaId}`);
}
