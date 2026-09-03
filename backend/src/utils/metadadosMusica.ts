/**
 * Busca metadados de uma música pelo nome (+ artista opcional) pra sugerir no
 * cadastro — o admin sempre confirma/edita antes de salvar, nada aqui é gravado
 * direto no banco.
 *
 *  - Artista + capa: iTunes Search API (gratuita, sem chave/cadastro).
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

interface ITunesResultado {
    artistName?: string;
    artworkUrl100?: string;
}

interface ITunesResposta {
    results?: ITunesResultado[];
}

async function buscarITunes(nome: string, artista?: string): Promise<{ artista: string | null; capaUrl: string | null }> {
    try {
        const termo = artista ? `${nome} ${artista}` : nome;
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&media=music&entity=song&limit=1`;
        const resp = await fetch(url);
        if (!resp.ok) return { artista: null, capaUrl: null };
        const data = (await resp.json()) as ITunesResposta;
        const item = data.results?.[0];
        if (!item) return { artista: null, capaUrl: null };
        return {
            artista: item.artistName ?? null,
            // iTunes só serve 100x100 por padrão — trocar pra uma versão maior (mesmo arquivo).
            capaUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : null,
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
    search?: GetSongBpmResultado[];
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
        return data.search ?? [];
    } catch (e) {
        console.warn('[GetSongBPM] erro de rede:', e);
        return [];
    }
}

async function buscarGetSongBpm(nome: string, artista?: string): Promise<{ tom: string | null; bpm: number | null }> {
    const lookup = artista ? `song:${nome} artist:${artista}` : `song:${nome}`;
    const item = (await buscarNoGetSongBpm(lookup))[0];
    if (!item) return { tom: null, bpm: null };
    const tempo = item.tempo !== undefined ? Number(item.tempo) : NaN;
    return {
        tom: item.key_of ?? item.open_key ?? null,
        bpm: Number.isFinite(tempo) ? Math.round(tempo) : null,
    };
}

export async function buscarMetadadosMusica(nome: string, artista?: string): Promise<MetadadosMusica> {
    const [itunes, bpm] = await Promise.all([
        buscarITunes(nome, artista),
        buscarGetSongBpm(nome, artista),
    ]);
    return { ...itunes, ...bpm };
}

export interface CandidatoMusica {
    titulo: string;
    artista: string | null;
    tom: string | null;
    bpm: number | null;
}

/**
 * Busca ao vivo (autocomplete) — devolve VÁRIOS candidatos pra pessoa escolher,
 * em vez de já cravar um só. Só a GetSongBPM tem esse tipo de busca por título
 * parcial; sem GETSONGBPM_API_KEY configurada devolve lista vazia (autocomplete
 * fica inerte, sem erro).
 */
export async function buscarCandidatosGetSongBpm(termo: string): Promise<CandidatoMusica[]> {
    const itens = await buscarNoGetSongBpm(`song:${termo}`);
    return itens
        .filter((item) => item.title)
        .slice(0, 8)
        .map((item) => {
            const tempo = item.tempo !== undefined ? Number(item.tempo) : NaN;
            return {
                titulo: item.title as string,
                artista: item.artist?.name ?? null,
                tom: item.key_of ?? item.open_key ?? null,
                bpm: Number.isFinite(tempo) ? Math.round(tempo) : null,
            };
        });
}
