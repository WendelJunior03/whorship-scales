import { query } from '../config/database';

// Pastas (coleções) de músicas por organização — módulo 10. org_id vem do
// DEFAULT/RLS. `ministerio_id` opcional (null = pasta da org toda).

export async function listarPastas() {
    const result = await query(
        `SELECT p.id, p.ministerio_id, p.nome, p.created_at,
                (SELECT COUNT(*)::int FROM pasta_musicas pm WHERE pm.pasta_id = p.id) AS total_musicas
           FROM pastas p
          ORDER BY p.nome ASC`,
    );
    return result.rows;
}

export async function buscarPasta(id: number) {
    const result = await query('SELECT * FROM pastas WHERE id = $1', [id]);
    return result.rows[0];
}

export async function criarPasta(nome: string, ministerioId: number | null) {
    const result = await query(
        'INSERT INTO pastas (nome, ministerio_id) VALUES ($1, $2) RETURNING *',
        [nome, ministerioId],
    );
    return result.rows[0];
}

export async function renomearPasta(id: number, nome: string) {
    const result = await query(
        'UPDATE pastas SET nome = $1 WHERE id = $2 RETURNING *',
        [nome, id],
    );
    return result.rows[0];
}

export async function apagarPasta(id: number) {
    const result = await query('DELETE FROM pastas WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

/** Músicas de uma pasta (dados completos da música, ordenadas por nome). */
export async function listarMusicasDaPasta(pastaId: number) {
    const result = await query(
        `SELECT m.*
           FROM pasta_musicas pm
           JOIN musicas m ON m.id = pm.musica_id
          WHERE pm.pasta_id = $1
          ORDER BY m.nome ASC`,
        [pastaId],
    );
    return result.rows;
}

/** Adiciona uma música à pasta (idempotente). */
export async function adicionarMusica(pastaId: number, musicaId: number) {
    await query(
        `INSERT INTO pasta_musicas (pasta_id, musica_id)
         VALUES ($1, $2) ON CONFLICT (pasta_id, musica_id) DO NOTHING`,
        [pastaId, musicaId],
    );
}

export async function removerMusica(pastaId: number, musicaId: number) {
    await query('DELETE FROM pasta_musicas WHERE pasta_id = $1 AND musica_id = $2', [pastaId, musicaId]);
}
