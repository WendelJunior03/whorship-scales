import { query } from '../config/database';

// Catálogo de músicas por organização (spec 08 + módulo 10). org_id é preenchido pelo
// DEFAULT/RLS (Passo 4) — as queries já saem escopadas na org atual.

export interface MusicaInput {
    nome: string;
    tomPadrao: string | null;
    bpm: number | null;
    artista: string | null;
    cifraUrl: string | null;
    audioUrl: string | null;
    capaUrl: string | null;
}

export async function criarMusica(input: MusicaInput) {
    const result = await query(
        `INSERT INTO musicas (nome, tom_padrao, bpm, artista, cifra_url, audio_url, capa_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [input.nome, input.tomPadrao, input.bpm, input.artista, input.cifraUrl, input.audioUrl, input.capaUrl],
    );
    return result.rows[0];
}

export async function listarMusicas() {
    const result = await query('SELECT * FROM musicas ORDER BY nome ASC');
    return result.rows;
}

export async function buscarMusica(id: number) {
    const result = await query('SELECT * FROM musicas WHERE id = $1', [id]);
    return result.rows[0];
}

export async function atualizarMusica(id: number, input: MusicaInput) {
    const result = await query(
        `UPDATE musicas
            SET nome = $1, tom_padrao = $2, bpm = $3, artista = $4, cifra_url = $5, audio_url = $6, capa_url = $7
          WHERE id = $8 RETURNING *`,
        [input.nome, input.tomPadrao, input.bpm, input.artista, input.cifraUrl, input.audioUrl, input.capaUrl, id],
    );
    return result.rows[0];
}

export async function apagarMusica(id: number) {
    const result = await query('DELETE FROM musicas WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

/**
 * Artistas = agregação por `musicas.artista` (sem tabela própria na v1). Retorna
 * cada artista com quantas músicas tem, ignorando quem não tem artista definido.
 */
export async function listarArtistas() {
    const result = await query(
        `SELECT artista, COUNT(*)::int AS total_musicas
           FROM musicas
          WHERE artista IS NOT NULL AND artista <> ''
          GROUP BY artista
          ORDER BY artista ASC`,
    );
    return result.rows;
}
