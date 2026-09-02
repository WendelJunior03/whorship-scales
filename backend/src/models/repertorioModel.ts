import { query } from "../config/database";

export async function createRepertorio(cultoId: number, nome: string, tom: string, linkMusica: string, musicaId: number | null) {
    const result = await query(
        'INSERT INTO repertorio (culto_id, nome, tom, link_musica, musica_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [cultoId, nome, tom, linkMusica, musicaId],
    );
    return result.rows[0]
}

export async function findAllRepertorios(cultoId: number) {
    const result = await query(
        `SELECT repertorio.*, musicas.capa_url
           FROM repertorio
           LEFT JOIN musicas ON musicas.id = repertorio.musica_id
          WHERE repertorio.culto_id = $1`,
        [cultoId],
    )
    return result.rows
}

export async function findRepertorioById(id: number) {
    const result = await query('SELECT * FROM repertorio WHERE id = $1', [id]);
    return result.rows[0];
}

export async function deleteRepertorio(id: number) {
    const result = await query('DELETE FROM repertorio WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}