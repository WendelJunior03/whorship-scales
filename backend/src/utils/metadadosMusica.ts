/**
 * Busca metadados de uma música pelo nome (+ artista opcional) pra sugerir no
 * cadastro — o admin sempre confirma/edita antes de salvar, nada aqui é gravado
 * direto no banco.
 *
 *  - Artista + capa: Deezer Search API (gratuita, sem chave/cadastro) — trocado do
 *    iTunes por ter catálogo bem maior de música gospel/BR (testado: dezenas a
 *    centenas de resultados pra artistas gospel BR, contra praticamente nada no
 *    iTunes pros mesmos termos).
 *  - Tom + BPM: GetSongBPM (https://getsongbpm.com/api) — gratuita, mas exige
 *    cadastro pra gerar uma API key (GETSONGBPM_API_KEY). Sem a chave configurada,
 *    essa parte fica desligada (retorna null) e o resto continua funcionando —
 *    mesmo padrão do billing/Stripe (integração opcional, app não quebra sem ela).
 *
 * Qualquer falha em qualquer uma das duas fontes → campos null (sugestão é
 * best-effort; o admin sempre pode preencher manualmente).
 */

interface MetadadosMusica {
    artista: string | null;
    capaUrl: string | null;
    tom: string | null;
    bpm: number | null;
}

interface DeezerResultado {
    title?: string;
    artist?: { name?: string };
    album?: { cover_big?: string; cover_medium?: string };
}

interface DeezerResposta {
    data?: DeezerResultado[];
}

async function buscarDeezer(nome: string, artista?: string): Promise<{ artista: string | null; capaUrl: string | null }> {
    try {
        const termo = artista ? `${nome} ${artista}` : nome;
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&limit=1`;
        const resp = await fetch(url);
        if (!resp.ok) return { artista: null, capaUrl: null };
        const data = (await resp.json()) as DeezerResposta;
        const item = data.data?.[0];
        if (!item) return { artista: null, capaUrl: null };
        return {
            artista: item.artist?.name ?? null,
            // cover_big = 500x500 (Deezer já serve o tamanho pronto, sem hack de URL).
            capaUrl: item.album?.cover_big ?? null,
        };
    } catch {
        return { artista: null, capaUrl: null };
    }
}

interface GetSongBpmResultado {
    title?: string;
    tempo?: string | number;
    key_of?: string;
    open_key?: string;
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
const GETSONGBPM_HOST = 'https://api.getsong.co';

async function buscarNoGetSongBpm(lookup: string): Promise<GetSongBpmResultado[]> {
    const apiKey = process.env.GETSONGBPM_API_KEY;
    if (!apiKey) return [];
    try {
        const url = `${GETSONGBPM_HOST}/search/?api_key=${apiKey}&type=song&lookup=${encodeURIComponent(lookup)}`;
        const resp = await fetch(url);
        if (!resp.ok) {
            // Log só no servidor (nunca no cliente) — sem isso, chave errada/expirada vira
            // "não achei nada" silencioso, difícil de diagnosticar de fora.
            console.warn(`[GetSongBPM] busca falhou (${resp.status}):`, await resp.text().catch(() => ''));
            return [];
        }
        const data = (await resp.json()) as GetSongBpmResposta;
        return Array.isArray(data.search) ? data.search : [];
    } catch (e) {
        console.warn('[GetSongBPM] erro de rede:', e);
        return [];
    }
}

async function buscarGetSongBpm(nome: string, _artista?: string): Promise<{ tom: string | null; bpm: number | null }> {
    // `_artista` fica na assinatura só por compatibilidade de chamada — não entra na
    // busca: testado direto contra a API, tanto "song:X artist:Y" quanto "X artist:Y"
    // e "X Y" davam "no result" mesmo pra combinações óbvias (ex.: "Yesterday" +
    // "Beatles"). Só o título puro (sem prefixo `song:`) encontra.
    const item = (await buscarNoGetSongBpm(nome))[0];
    if (!item) return { tom: null, bpm: null };
    const tempo = item.tempo !== undefined ? Number(item.tempo) : NaN;
    return {
        tom: item.key_of ?? item.open_key ?? null,
        bpm: Number.isFinite(tempo) ? Math.round(tempo) : null,
    };
}

export async function buscarMetadadosMusica(nome: string, artista?: string): Promise<MetadadosMusica> {
    const [deezer, bpm] = await Promise.all([
        buscarDeezer(nome, artista),
        buscarGetSongBpm(nome, artista),
    ]);
    return { ...deezer, ...bpm };
}

export interface CandidatoMusica {
    titulo: string;
    artista: string | null;
    tom: string | null;
    bpm: number | null;
    capaUrl: string | null;
}

/**
 * Busca ao vivo (autocomplete) — devolve VÁRIOS candidatos pra pessoa escolher
 * enquanto digita, em vez de já cravar um só.
 *
 * Usa a Deezer (gratuita, sem chave) porque ela faz busca por título parcial e
 * traz vários resultados com título + artista + capa — e tem catálogo BR/gospel
 * bem maior que a GetSongBPM. Tom/BPM não vêm daqui (a Deezer não expõe): ficam
 * null e são preenchidos ao escolher o item, via GetSongBPM (quando há chave).
 */
export async function buscarCandidatosMusica(termo: string): Promise<CandidatoMusica[]> {
    try {
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(termo)}&limit=15`;
        const resp = await fetch(url);
        if (!resp.ok) return [];
        const data = (await resp.json()) as DeezerResposta;
        const itens = data.data ?? [];
        // Deezer repete o mesmo louvor em vários álbuns/singles — dedup por
        // título+artista pra lista não vir cheia de duplicados.
        const vistos = new Set<string>();
        const candidatos: CandidatoMusica[] = [];
        for (const item of itens) {
            const titulo = item.title?.trim();
            if (!titulo) continue;
            const artista = item.artist?.name ?? null;
            const chave = `${titulo.toLowerCase()}|${(artista ?? '').toLowerCase()}`;
            if (vistos.has(chave)) continue;
            vistos.add(chave);
            candidatos.push({
                titulo,
                artista,
                tom: null,
                bpm: null,
                capaUrl: item.album?.cover_big ?? item.album?.cover_medium ?? null,
            });
            if (candidatos.length >= 8) break;
        }
        return candidatos;
    } catch {
        return [];
    }
}
