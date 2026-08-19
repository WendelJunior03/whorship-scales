import { query } from '../config/database';

// Vídeos (YouTube na v1) ligados a uma música (spec 08). Escopo por org via RLS (Passo 4);
// os JOINs com `musicas` também saem escopados (as duas tabelas têm RLS).

export async function criarVideo(
    musicaId: number,
    provider: string,
    videoId: string,
    categoria: string,
    titulo: string | null,
    adicionadoPor: number,
) {
    const result = await query(
        `INSERT INTO videos (musica_id, provider, video_id, categoria, titulo, adicionado_por)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [musicaId, provider, videoId, categoria, titulo, adicionadoPor],
    );
    return result.rows[0];
}

export async function listarVideosPorMusica(musicaId: number) {
    const result = await query(
        'SELECT * FROM videos WHERE musica_id = $1 ORDER BY created_at DESC',
        [musicaId],
    );
    return result.rows;
}

export async function listarTodosVideos() {
    const result = await query(
        `SELECT v.*, m.nome AS musica_nome
         FROM videos v
         JOIN musicas m ON m.id = v.musica_id
         ORDER BY m.nome ASC, v.created_at DESC`,
    );
    return result.rows;
}

export async function apagarVideo(id: number) {
    const result = await query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}
