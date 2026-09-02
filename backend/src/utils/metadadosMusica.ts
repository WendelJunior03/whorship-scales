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
    tempo?: string | number;
    key_of?: string;
}

interface GetSongBpmResposta {
    search?: GetSongBpmResultado[];
}

async function buscarGetSongBpm(nome: string, artista?: string): Promise<{ tom: string | null; bpm: number | null }> {
    const apiKey = process.env.GETSONGBPM_API_KEY;
    if (!apiKey) return { tom: null, bpm: null };
    try {
        const lookup = artista ? `song:${nome} artist:${artista}` : `song:${nome}`;
        const url = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=song&lookup=${encodeURIComponent(lookup)}`;
        const resp = await fetch(url);
        if (!resp.ok) return { tom: null, bpm: null };
        const data = (await resp.json()) as GetSongBpmResposta;
        const item = data.search?.[0];
        if (!item) return { tom: null, bpm: null };
        const tempo = item.tempo !== undefined ? Number(item.tempo) : NaN;
        return {
            tom: item.key_of ?? null,
            bpm: Number.isFinite(tempo) ? Math.round(tempo) : null,
        };
    } catch {
        return { tom: null, bpm: null };
    }
}

export async function buscarMetadadosMusica(nome: string, artista?: string): Promise<MetadadosMusica> {
    const [itunes, bpm] = await Promise.all([
        buscarITunes(nome, artista),
        buscarGetSongBpm(nome, artista),
    ]);
    return { ...itunes, ...bpm };
}
