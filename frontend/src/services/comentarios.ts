import { api } from './api';
import { Comentario } from '@/types';

export async function listarComentarios(cultoId: number): Promise<Comentario[]> {
  const { data } = await api.get<Comentario[]>(`/comentarios/culto/${cultoId}`);
  return data;
}

export async function criarComentario(cultoId: number, texto: string): Promise<Comentario> {
  const { data } = await api.post<Comentario>('/comentarios', { cultoId, texto });
  return data;
}
