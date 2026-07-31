import { query } from "../config/database";

export async function createRepertorio(cultoId: number, nome: string, tom: string, linkMusica: string) {
    const result = await query('INSERT INTO repertorio (culto_id, nome, tom, link_musica) VALUES ($1, $2, $3, $4) RETURNING *', [cultoId, nome, tom, linkMusica]);
    return result.rows[0]
}

export async function findAllRepertorios(cultoId: number) {
    const result = await query('SELECT * FROM repertorio WHERE culto_id = $1', [cultoId])
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