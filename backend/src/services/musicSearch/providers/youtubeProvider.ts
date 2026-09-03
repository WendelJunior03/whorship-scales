import { MusicProvider, MusicSearchResult } from '../types';

interface YoutubeThumbnail {
    url?: string;
}

interface YoutubeItem {
    id?: { videoId?: string };
    snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { high?: YoutubeThumbnail; medium?: YoutubeThumbnail; default?: YoutubeThumbnail };
    };
}

interface YoutubeResposta {
    items?: YoutubeItem[];
    error?: { message?: string };
}

/**
 * YouTube Data API v3 (search.list) — preparada pra Fase 2, ativa sozinha assim
 * que YOUTUBE_API_KEY existir no .env (nenhuma outra mudança de código necessária).
 *
 * Cota gratuita é pequena (10.000 unidades/dia; um search.list custa 100 — ou
 * seja, ~100 buscas/dia). Por isso: `videoCategoryId=10` (categoria Música, reduz
 * ruído) e `maxResults=8` (não busca mais do que o dropdown mostra). O cache do
 * agregador (`cache.ts`) é a principal defesa contra estourar a cota — a mesma
 * busca repetida por várias pessoas não bate na API de novo.
 *
 * "Artista" aqui é o nome do canal, não necessariamente o artista de verdade
 * (pode ser um canal de cover/playback) — é uma limitação da fonte, esperada.
 */
export const youtubeProvider: MusicProvider = {
    source: 'youtube',
    async buscar(termo: string): Promise<MusicSearchResult[]> {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return []; // sem chave = provider inerte, nunca obrigatório.
        try {
            const params = new URLSearchParams({
                part: 'snippet',
                type: 'video',
                videoCategoryId: '10',
                maxResults: '8',
                q: termo,
                key: apiKey,
            });
            const resp = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
            if (!resp.ok) {
                const corpo = await resp.json().catch(() => null);
                console.warn(`[YouTube] busca falhou (${resp.status}):`, corpo?.error?.message ?? '');
                return [];
            }
            const data = (await resp.json()) as YoutubeResposta;
            return (data.items ?? [])
                .filter((item) => item.id?.videoId && item.snippet?.title)
                .map((item) => {
                    const capa =
                        item.snippet!.thumbnails?.high?.url ??
                        item.snippet!.thumbnails?.medium?.url ??
                        item.snippet!.thumbnails?.default?.url;
                    return {
                        id: `youtube-${item.id!.videoId}`,
                        title: item.snippet!.title as string,
                        artist: item.snippet!.channelTitle ?? '',
                        // exactOptionalPropertyTypes: só inclui a chave se tiver valor de verdade.
                        ...(capa ? { coverUrl: capa } : {}),
                        source: 'youtube' as const,
                        externalId: item.id!.videoId as string,
                    };
                });
        } catch (e) {
            console.warn('[YouTube] erro de rede:', e);
            return [];
        }
    },
};
