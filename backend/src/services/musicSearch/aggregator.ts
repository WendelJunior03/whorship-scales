import { FonteMusica, MusicProvider, MusicSearchResult } from './types';
import { deezerProvider } from './providers/deezerProvider';
import { itunesProvider } from './providers/itunesProvider';
import { getSongBpmProvider } from './providers/getSongBpmProvider';
import { youtubeProvider } from './providers/youtubeProvider';
import { normalizarTexto } from './normalizar';
import { deduplicar } from './deduplicar';
import { CacheComTtl } from './cache';

/** Prioridade das fontes — resolve qual "vence" quando a mesma música aparece em
 *  mais de uma, e ordena o resultado final. Mudar a ordem aqui é o único lugar
 *  necessário (nada mais no código depende de uma ordem fixa). */
export const PRIORIDADE_FONTES: FonteMusica[] = ['deezer', 'itunes', 'getsongbpm', 'youtube'];

const MAX_RESULTADOS = 8;

const PROVIDERS: MusicProvider[] = [deezerProvider, itunesProvider, getSongBpmProvider, youtubeProvider];

const TTL_MS = (Number(process.env.MUSIC_SEARCH_CACHE_TTL) || 3600) * 1000;
const TIMEOUT_MS = Number(process.env.MUSIC_PROVIDER_TIMEOUT) || 3000;

const cache = new CacheComTtl<MusicSearchResult[]>(TTL_MS);

/** Corre uma promessa contra um timeout — se estourar, resolve com `valorPadrao`
 *  em vez de deixar uma fonte lenta segurar a resposta inteira. Nenhum provider
 *  rejeita sozinho (cada um já trata os próprios erros); isso aqui é só um teto
 *  de tempo por cima. */
function comTimeout<T>(promessa: Promise<T>, ms: number, valorPadrao: T): Promise<T> {
    return Promise.race([
        promessa,
        new Promise<T>((resolve) => setTimeout(() => resolve(valorPadrao), ms)),
    ]);
}

/**
 * Busca em todas as fontes em paralelo, sem deixar uma fonte lenta/fora do ar
 * travar as outras (timeout individual) nem derrubar a busca inteira
 * (Promise.allSettled — cada provider já devolve [] em erro, isso é reforço).
 * Deduplica por título+artista normalizado, ordena pela prioridade da fonte
 * "vencedora" e cacheia pela consulta normalizada (TTL configurável).
 */
export async function buscarMusicasAgregado(termo: string): Promise<MusicSearchResult[]> {
    const chaveCache = normalizarTexto(termo);
    const emCache = cache.get(chaveCache);
    if (emCache) return emCache;

    const resultadosPorProvider = await Promise.allSettled(
        PROVIDERS.map((provider) => comTimeout(provider.buscar(termo), TIMEOUT_MS, [] as MusicSearchResult[])),
    );

    const todos = resultadosPorProvider.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    const unicos = deduplicar(todos, PRIORIDADE_FONTES);
    unicos.sort((a, b) => PRIORIDADE_FONTES.indexOf(a.source) - PRIORIDADE_FONTES.indexOf(b.source));

    const finais = unicos.slice(0, MAX_RESULTADOS);
    cache.set(chaveCache, finais);
    return finais;
}
