import { query } from '../config/database';

export interface Aviso {
    id: number;
    ministerio_id: number | null;
    titulo: string;
    corpo: string | null;
    autor_id: number | null;
    autor_nome: string | null;
    publicado_em: string;
    created_at: string;
    lido?: boolean;
}

/**
 * Lista os avisos da org (RLS), do mais recente pro mais antigo, já com o nome
 * do autor e se o `membroId` informado leu cada um.
 */
export async function listarAvisos(membroId: number) {
    const result = await query(
        `SELECT a.id, a.ministerio_id, a.titulo, a.corpo, a.autor_id,
                m.nome AS autor_nome, a.publicado_em, a.created_at,
                (l.membro_id IS NOT NULL) AS lido
           FROM avisos a
           LEFT JOIN membros m ON m.id = a.autor_id
           LEFT JOIN aviso_leituras l ON l.aviso_id = a.id AND l.membro_id = $1
          ORDER BY a.publicado_em DESC, a.id DESC`,
        [membroId],
    );
    return result.rows;
}

/** Quantos avisos o membro ainda não leu (badge). */
export async function contarNaoLidos(membroId: number): Promise<number> {
    const result = await query(
        `SELECT COUNT(*)::int AS total
           FROM avisos a
           LEFT JOIN aviso_leituras l ON l.aviso_id = a.id AND l.membro_id = $1
          WHERE l.membro_id IS NULL`,
        [membroId],
    );
    return result.rows[0]?.total ?? 0;
}

export async function findAvisoById(id: number, membroId: number) {
    const result = await query(
        `SELECT a.id, a.ministerio_id, a.titulo, a.corpo, a.autor_id,
                m.nome AS autor_nome, a.publicado_em, a.created_at,
                (l.membro_id IS NOT NULL) AS lido
           FROM avisos a
           LEFT JOIN membros m ON m.id = a.autor_id
           LEFT JOIN aviso_leituras l ON l.aviso_id = a.id AND l.membro_id = $2
          WHERE a.id = $1`,
        [id, membroId],
    );
    return result.rows[0];
}

/** Só os campos crus (sem JOIN) — usado nas checagens de existência. */
export async function findAvisoCru(id: number) {
    const result = await query('SELECT * FROM avisos WHERE id = $1', [id]);
    return result.rows[0];
}

export async function criarAviso(input: {
    titulo: string;
    corpo: string | null;
    ministerioId: number | null;
    autorId: number | null;
}) {
    // org_id vem do DEFAULT da sessão (RLS).
    const result = await query(
        `INSERT INTO avisos (titulo, corpo, ministerio_id, autor_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [input.titulo, input.corpo, input.ministerioId, input.autorId],
    );
    return result.rows[0];
}

export async function atualizarAviso(
    id: number,
    campos: { titulo: string; corpo: string | null; ministerioId: number | null },
) {
    const result = await query(
        `UPDATE avisos SET titulo = $2, corpo = $3, ministerio_id = $4 WHERE id = $1 RETURNING *`,
        [id, campos.titulo, campos.corpo, campos.ministerioId],
    );
    return result.rows[0];
}

export async function deletarAviso(id: number) {
    const result = await query('DELETE FROM avisos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

/** Marca um aviso como lido pelo membro (idempotente). */
export async function marcarLido(avisoId: number, membroId: number) {
    await query(
        `INSERT INTO aviso_leituras (aviso_id, membro_id)
         VALUES ($1, $2)
         ON CONFLICT (aviso_id, membro_id) DO NOTHING`,
        [avisoId, membroId],
    );
}
