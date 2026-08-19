import { api } from './api';
import { Musica } from '@/types';

export interface MusicaInput {
  nome: string;
  tomPadrao?: string | null;
  bpm?: number | null;
}

export async function listarMusicas(): Promise<Musica[]> {
  const { data } = await api.get<Musica[]>('/musicas');
  return data;
}

export async function getMusica(id: number): Promise<Musica> {
  const { data } = await api.get<Musica>(`/musicas/${id}`);
  return data;
}

export async function criarMusica(input: MusicaInput): Promise<Musica> {
  const { data } = await api.post<Musica>('/musicas', input);
  return data;
}

export async function atualizarMusica(id: number, input: MusicaInput): Promise<Musica> {
  const { data } = await api.put<Musica>(`/musicas/${id}`, input);
  return data;
}

export async function apagarMusica(id: number): Promise<void> {
  await api.delete(`/musicas/${id}`);
}
