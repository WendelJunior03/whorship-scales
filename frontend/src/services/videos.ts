import { api } from './api';
import { CategoriaVideo, Video } from '@/types';

export interface VideoInput {
  musicaId: number;
  link: string;
  categoria: CategoriaVideo;
  titulo?: string | null;
}

export async function listarVideosPorMusica(musicaId: number): Promise<Video[]> {
  const { data } = await api.get<Video[]>('/videos', { params: { musicaId } });
  return data;
}

export async function criarVideo(input: VideoInput): Promise<Video> {
  const { data } = await api.post<Video>('/videos', input);
  return data;
}

export async function apagarVideo(id: number): Promise<void> {
  await api.delete(`/videos/${id}`);
}
