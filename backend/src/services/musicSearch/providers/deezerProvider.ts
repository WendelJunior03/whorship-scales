import { MusicProvider, MusicSearchResult } from '../types';

interface DeezerResultado {
    id?: number;
    title?: string;
    artist?: { name?: string };
    album?: { cover_big?: string };
}

interface DeezerResposta {
    data?: DeezerResultado[];
}

/** Deezer Search API — gratuita, sem chave/cadastro. Catálogo bem maior que o
 *  iTunes pra gospel/BR (testado antes de escolher). Não tem BPM confiável nem
 *  tom, então só entra com título/artista/capa mesmo. */
export const deezerProvider: MusicProvider = {
    source: 'deezer',
    async buscar(termo: string): Promise<MusicSearchResult[]> {
        try {
            const url = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&limit=8`;
            const resp = await fetch(url);
            if (!resp.ok) return [];
            const data = (await resp.json()) as DeezerResposta;
            return (data.data ?? [])
                .filter((item) => item.title && item.artist?.name)
                .map((item) => ({
                    id: `deezer-${item.id}`,
                    title: item.title as string,
                    artist: item.artist!.name as string,
                    // exactOptionalPropertyTypes: só inclui a chave se tiver valor de verdade.
                    ...(item.album?.cover_big ? { coverUrl: item.album.cover_big } : {}),
                    source: 'deezer' as const,
                    externalId: String(item.id ?? ''),
                }));
        } catch (e) {
            console.warn('[Deezer] erro de busca:', e);
            return [];
        }
    },
};
