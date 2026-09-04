import { MusicProvider, MusicSearchResult } from '../types';

interface ITunesResultado {
    trackId?: number;
    trackName?: string;
    artistName?: string;
    artworkUrl100?: string;
}

interface ITunesResposta {
    results?: ITunesResultado[];
}

/** iTunes Search API — gratuita, sem chave/cadastro. Catálogo geralmente menor
 *  que o Deezer pra gospel/BR, mas soma cobertura (o agregador deduplica). */
export const itunesProvider: MusicProvider = {
    source: 'itunes',
    async buscar(termo: string): Promise<MusicSearchResult[]> {
        try {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&media=music&entity=song&limit=8`;
            const resp = await fetch(url);
            if (!resp.ok) return [];
            const data = (await resp.json()) as ITunesResposta;
            return (data.results ?? [])
                .filter((item) => item.trackName && item.artistName)
                .map((item) => ({
                    id: `itunes-${item.trackId}`,
                    title: item.trackName as string,
                    artist: item.artistName as string,
                    // iTunes só serve 100x100 por padrão — troca pra uma versão maior (mesmo arquivo).
                    // exactOptionalPropertyTypes: só inclui a chave se tiver valor de verdade.
                    ...(item.artworkUrl100 ? { coverUrl: item.artworkUrl100.replace('100x100', '600x600') } : {}),
                    source: 'itunes' as const,
                    externalId: String(item.trackId ?? ''),
                }));
        } catch (e) {
            console.warn('[iTunes] erro de busca:', e);
            return [];
        }
    },
};
