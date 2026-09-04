import { MusicProvider, MusicSearchResult } from '../types';
import { obterTokenSpotify } from './spotifyAuth';

interface SpotifyImagem {
    url?: string;
}

interface SpotifyTrack {
    id?: string;
    name?: string;
    artists?: { name?: string }[];
    album?: { images?: SpotifyImagem[] };
    external_urls?: { spotify?: string };
}

interface SpotifySearchResposta {
    tracks?: { items?: SpotifyTrack[] };
}

/** Spotify Web API (Client Credentials, sem login) — além de contribuir com
 *  título/artista/capa igual aos outros providers, é a fonte do link oficial
 *  `links.spotify`. Sem SPOTIFY_CLIENT_ID/SECRET, fica inerte (nunca obrigatória). */
export const spotifyProvider: MusicProvider = {
    source: 'spotify',
    async buscar(termo: string): Promise<MusicSearchResult[]> {
        const token = await obterTokenSpotify();
        if (!token) return [];
        try {
            const params = new URLSearchParams({ q: termo, type: 'track', limit: '8' });
            const resp = await fetch(`https://api.spotify.com/v1/search?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) {
                console.warn(`[Spotify] busca falhou (${resp.status}):`, await resp.text().catch(() => ''));
                return [];
            }
            const data = (await resp.json()) as SpotifySearchResposta;
            return (data.tracks?.items ?? [])
                .filter((track) => track.name && track.artists?.[0]?.name)
                .map((track) => {
                    const capa = track.album?.images?.[0]?.url;
                    const linkSpotify = track.external_urls?.spotify;
                    return {
                        id: `spotify-${track.id}`,
                        title: track.name as string,
                        artist: track.artists?.[0]?.name as string,
                        // exactOptionalPropertyTypes: só inclui as chaves opcionais se tiverem valor.
                        ...(capa ? { coverUrl: capa } : {}),
                        source: 'spotify' as const,
                        externalId: track.id ?? '',
                        ...(linkSpotify ? { links: { spotify: linkSpotify } } : {}),
                    };
                });
        } catch (e) {
            console.warn('[Spotify] erro de rede:', e);
            return [];
        }
    },
};
