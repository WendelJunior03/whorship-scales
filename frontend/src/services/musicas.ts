import { api } from './api';
import { Musica, Artista } from '@/types';

export interface MusicaInput {
  nome: string;
  tomPadrao?: string | null;
  bpm?: number | null;
  artista?: string | null;
  cifraUrl?: string | null;
  audioUrl?: string | null;
  capaUrl?: string | null;
}

export interface MetadadosMusica {
  artista: string | null;
  capaUrl: string | null;
  tom: string | null;
  bpm: number | null;
}

export interface CandidatoMusica {
  titulo: string;
  artista: string | null;
  tom: string | null;
  bpm: number | null;
}

/** Formato único vindo do agregador (backend) — não importa de qual fonte
 *  (Deezer/iTunes/GetSongBPM/YouTube) cada item veio. */
export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  source: 'deezer' | 'itunes' | 'youtube' | 'getsongbpm';
  externalId: string;
}

export async function listarMusicas(): Promise<Musica[]> {
  const { data } = await api.get<Musica[]>('/musicas');
  return data;
}

export async function listarArtistas(): Promise<Artista[]> {
  const { data } = await api.get<Artista[]>('/musicas/artistas');
  return data;
}

export async function buscarMetadados(nome: string, artista?: string): Promise<MetadadosMusica> {
  const { data } = await api.get<MetadadosMusica>('/musicas/buscar-metadados', {
    params: { nome, artista: artista || undefined },
  });
  return data;
}

/** Autocomplete ao vivo (GetSongBPM, só essa fonte) — mantido por compatibilidade,
 *  não é mais usado pelo dropdown da Biblioteca (ver `buscarAgregado`). */
export async function buscarCandidatos(termo: string): Promise<CandidatoMusica[]> {
  const { data } = await api.get<CandidatoMusica[]>('/musicas/buscar-getsongbpm', {
    params: { q: termo },
  });
  return data;
}

/** Autocomplete ao vivo — agregador de várias fontes (Deezer, iTunes, GetSongBPM,
 *  YouTube quando ativo), já deduplicado. Usado pelo dropdown de Nova música. */
export async function buscarAgregado(termo: string): Promise<MusicSearchResult[]> {
  const { data } = await api.get<MusicSearchResult[]>('/musicas/buscar-agregado', {
    params: { q: termo },
  });
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
