import { MusicProvider, MusicSearchResult } from '../types';

interface GetSongBpmResultado {
    id?: string;
    title?: string;
    artist?: { name?: string };
}

interface GetSongBpmResposta {
    // Quando não acha nada, a API devolve `search` como OBJETO de erro
    // (`{ error: "no result" }`), não uma lista vazia — precisa checar o tipo.
    search?: GetSongBpmResultado[] | { error?: string };
}

// ⚠️ O host documentado (api.getsongbpm.com) fica atrás de um desafio anti-bot da
// Cloudflare que bloqueia fetch de servidor (sem navegador) — sempre retorna 403 com
// uma página de challenge, não o JSON da API. api.getsong.co é o host de verdade
// (confirmado testando os dois direto). Não trocar de volta sem testar de novo.
//
// Também: o lookup NÃO aceita prefixo "song:" nem combinação "song:X artist:Y" —
// testado direto, ambos davam "no result" pra qualquer termo, até os óbvios
// ("Yesterday"). Só o termo puro (sem prefixo, sem artista) encontra.
const HOST = 'https://api.getsong.co';

/** GetSongBPM — única fonte com tom/BPM, mas catálogo gospel/BR limitado e sem
 *  capa nenhuma (o objeto `album` deles não tem campo de imagem). Nesta fase o
 *  frontend não usa tom/BPM ainda (só título/artista/capa no dropdown), mas o
 *  dado já vem certo pra quando isso for exposto. Sem GETSONGBPM_API_KEY, fica
 *  inerte (lista vazia) — nunca obrigatória pro resto funcionar. */
export const getSongBpmProvider: MusicProvider = {
    source: 'getsongbpm',
    async buscar(termo: string): Promise<MusicSearchResult[]> {
        const apiKey = process.env.GETSONGBPM_API_KEY;
        if (!apiKey) return [];
        try {
            const url = `${HOST}/search/?api_key=${apiKey}&type=song&lookup=${encodeURIComponent(termo)}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                console.warn(`[GetSongBPM] busca falhou (${resp.status}):`, await resp.text().catch(() => ''));
                return [];
            }
            const data = (await resp.json()) as GetSongBpmResposta;
            const itens = Array.isArray(data.search) ? data.search : [];
            return itens
                .filter((item) => item.title && item.artist?.name)
                .map((item) => ({
                    id: `getsongbpm-${item.id ?? item.title}`,
                    title: item.title as string,
                    artist: item.artist!.name as string,
                    // sem coverUrl -- a API não devolve imagem de álbum.
                    source: 'getsongbpm' as const,
                    externalId: item.id ?? '',
                }));
        } catch (e) {
            console.warn('[GetSongBPM] erro de rede:', e);
            return [];
        }
    },
};
