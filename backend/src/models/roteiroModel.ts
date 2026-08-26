import { query } from '../config/database';

export async function listarRoteiro(cultoId: number) {
    const result = await query(
        `SELECT id, culto_id, ordem, tipo, musica_id, titulo, duracao_seg, tom, link_musica
         FROM roteiro_itens
         WHERE culto_id = $1
         ORDER BY ordem ASC, id ASC`,
        [cultoId],
    );
    return result.rows;
}

export async function findRoteiroItemById(id: number) {
    const result = await query('SELECT * FROM roteiro_itens WHERE id = $1', [id]);
    return result.rows[0];
}

export async function criarRoteiroItem(input: {
    cultoId: number;
    tipo: string;
    titulo: string | null;
    tom: string | null;
    duracaoSeg: number | null;
    musicaId: number | null;
    linkMusica: string | null;
}) {
    // Novo item entra no fim do roteiro. org_id vem do DEFAULT da sessão (RLS).
    const result = await query(
        `INSERT INTO roteiro_itens (culto_id, ordem, tipo, titulo, tom, duracao_seg, musica_id, link_musica)
         VALUES (
            $1,
            COALESCE((SELECT MAX(ordem) FROM roteiro_itens WHERE culto_id = $1), 0) + 1,
            $2, $3, $4, $5, $6, $7
         )
         RETURNING *`,
        [input.cultoId, input.tipo, input.titulo, input.tom, input.duracaoSeg, input.musicaId, input.linkMusica],
    );
    return result.rows[0];
}

export async function atualizarRoteiroItem(
    id: number,
    campos: { titulo: string | null; tom: string | null; duracaoSeg: number | null },
) {
    const result = await query(
        `UPDATE roteiro_itens
            SET titulo = $2, tom = $3, duracao_seg = $4
          WHERE id = $1 RETURNING *`,
        [id, campos.titulo, campos.tom, campos.duracaoSeg],
    );
    return result.rows[0];
}

export async function deletarRoteiroItem(id: number) {
    const result = await query('DELETE FROM roteiro_itens WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

/** Reordena o roteiro de um culto: `ids` na ordem desejada → ordem = 1,2,3... */
export async function reordenarRoteiro(cultoId: number, ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
        await query('UPDATE roteiro_itens SET ordem = $1 WHERE id = $2 AND culto_id = $3', [
            i + 1,
            ids[i],
            cultoId,
        ]);
    }
}
