import { FonteMusica, MusicProvider, MusicSearchResult } from './types';
import { deezerProvider } from './providers/deezerProvider';
import { itunesProvider } from './providers/itunesProvider';
import { getSongBpmProvider } from './providers/getSongBpmProvider';
import { youtubeProvider } from './providers/youtubeProvider';
import { spotifyProvider } from './providers/spotifyProvider';
import { normalizarTexto } from './normalizar';
import { deduplicar } from './deduplicar';
import { resolverLinkCifraClub } from './cifraClub';
import { CacheComTtl } from './cache';

/** Prioridade das fontes — resolve qual "vence" quando a mesma música aparece em
 *  mais de uma (dedup) e desempata a ORDEM final. NÃO decide quem entra nos
 *  MAX_RESULTADOS (isso é `selecionarComEquidade`, abaixo — todo provider tem
 *  chance de contribuir). Mudar a ordem aqui é o único lugar necessário. Spotify
 *  entra logo depois do Deezer — metadado costuma ser tão bom quanto, e é a
 *  única fonte com link oficial de streaming; ajustar aqui se quiser outra ordem. */
export const PRIORIDADE_FONTES: FonteMusica[] = ['deezer', 'spotify', 'itunes', 'getsongbpm', 'youtube'];

const MAX_RESULTADOS = 8;

const PROVIDERS: MusicProvider[] = [
    deezerProvider,
    itunesProvider,
    getSongBpmProvider,
    youtubeProvider,
    spotifyProvider,
];

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

/** Anexa o link de pesquisa do Cifra Club a cada resultado (não é uma "fonte" —
 *  não pesquisa nada, só monta a URL a partir do título/artista que já temos). */
function comLinkCifraClub(resultado: MusicSearchResult): MusicSearchResult {
    const cifraClub = resolverLinkCifraClub(resultado.title, resultado.artist);
    if (!cifraClub) return resultado;
    return { ...resultado, links: { ...resultado.links, cifraClub } };
}

/**
 * Escolhe os `limite` resultados finais dando chance PRA TODA fonte contribuir,
 * em vez de deixar uma fonte com muitos resultados (ex.: Deezer) tomar todas as
 * vagas sozinha. Faz isso em rodadas: pega 1 resultado de cada fonte (na ordem
 * de prioridade) por vez, repetindo até encher `limite` ou todas as filas
 * esvaziarem. Só DEPOIS de decidir quem entra é que a prioridade volta a valer
 * — agora só pra ordenar a lista final (feito por quem chama esta função).
 */
function selecionarComEquidade(
    unicos: MusicSearchResult[],
    prioridade: FonteMusica[],
    limite: number,
): MusicSearchResult[] {
    const filaPorFonte = new Map<FonteMusica, MusicSearchResult[]>();
    for (const item of unicos) {
        const fila = filaPorFonte.get(item.source);
        if (fila) fila.push(item);
        else filaPorFonte.set(item.source, [item]);
    }

    // Percorre as fontes da prioridade primeiro; qualquer fonte fora dessa lista
    // (não deveria acontecer, mas por garantia) entra no final, sem perder resultado.
    const ordemFontes = [
        ...prioridade,
        ...[...filaPorFonte.keys()].filter((fonte) => !prioridade.includes(fonte)),
    ];

    const selecionados: MusicSearchResult[] = [];
    let alguemContribuiu = true;
    while (selecionados.length < limite && alguemContribuiu) {
        alguemContribuiu = false;
        for (const fonte of ordemFontes) {
            if (selecionados.length >= limite) break;
            const fila = filaPorFonte.get(fonte);
            const proximo = fila?.shift();
            if (proximo) {
                selecionados.push(proximo);
                alguemContribuiu = true;
            }
        }
    }
    return selecionados;
}

/**
 * Busca em todas as fontes em paralelo, sem deixar uma fonte lenta/fora do ar
 * travar as outras (timeout individual) nem derrubar a busca inteira
 * (Promise.allSettled — cada provider já devolve [] em erro, isso é reforço).
 * Deduplica por título+artista normalizado MESCLANDO capa/links das fontes que
 * bateram (sem limite ainda — toda fonte configurada tem chance de contribuir),
 * seleciona os finais com equidade entre fontes, só então ordena pela
 * prioridade da fonte "vencedora", anexa o link de pesquisa do Cifra Club e
 * cacheia pela consulta normalizada (TTL configurável).
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
    const selecionados = selecionarComEquidade(unicos, PRIORIDADE_FONTES, MAX_RESULTADOS);
    selecionados.sort((a, b) => PRIORIDADE_FONTES.indexOf(a.source) - PRIORIDADE_FONTES.indexOf(b.source));

    const finais = selecionados.map(comLinkCifraClub);
    cache.set(chaveCache, finais);
    return finais;
}
