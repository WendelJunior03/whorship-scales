/**
 * Resolve a URL da capa a partir de um link de áudio/vídeo:
 *  - YouTube: thumbnail pelo id do vídeo (sem chamada externa).
 *  - Spotify: via oEmbed público (https://open.spotify.com/oembed) — sem auth.
 * Qualquer falha/link não suportado → null (a capa é opcional).
 */

const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export function extrairVideoIdYoutube(url: string): string | null {
    const m = url.match(YT_RE);
    return m?.[1] ?? null;
}

function ehSpotify(url: string): boolean {
    return /open\.spotify\.com\/(track|album|playlist|episode|show)\//.test(url);
}

async function capaSpotify(url: string): Promise<string | null> {
    try {
        const resp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (!resp.ok) return null;
        const data = (await resp.json()) as { thumbnail_url?: string };
        return data.thumbnail_url ?? null;
    } catch {
        return null;
    }
}

export async function resolverCapaMusica(audioUrl: string | null): Promise<string | null> {
    if (!audioUrl) return null;
    const videoId = extrairVideoIdYoutube(audioUrl);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    if (ehSpotify(audioUrl)) {
        return capaSpotify(audioUrl);
    }
    return null;
}
