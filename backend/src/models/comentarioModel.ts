import { query } from '../config/database';

export async function listarComentariosDoCulto(cultoId: number) {
    const result = await query(
        `SELECT c.id, c.culto_id, c.membro_id, c.texto, c.created_at, m.nome AS autor_nome
         FROM escala_comentarios c
         JOIN membros m ON m.id = c.membro_id
         WHERE c.culto_id = $1
         ORDER BY c.created_at ASC`,
        [cultoId],
    );
    return result.rows;
}

export async function criarComentario(cultoId: number, membroId: number, texto: string) {
    // org_id vem do DEFAULT da sessão (RLS) — igual às escalas.
    const result = await query(
        'INSERT INTO escala_comentarios (culto_id, membro_id, texto) VALUES ($1, $2, $3) RETURNING *',
        [cultoId, membroId, texto],
    );
    return result.rows[0];
}

/**
 * Participantes do culto (para notificar sobre um novo comentário): quem está
 * escalado por vocal ou avulsa (fora recusados) + a escala fixa efetiva do dia
 * (considerando substituição por exceção). `data` = 'YYYY-MM-DD'; `diaSemana`
 * pode ser null quando a data não cai num dia com escala fixa.
 */
export async function findParticipantesDoCulto(
    cultoId: number,
    data: string,
    diaSemana: string | null,
) {
    const result = await query(
        `SELECT DISTINCT membro_id FROM (
            SELECT membro_id FROM escala_vocal   WHERE culto_id = $1 AND status <> 'recusado'
            UNION
            SELECT membro_id FROM escala_avulsa  WHERE culto_id = $1 AND status <> 'recusado'
            UNION
            SELECT COALESCE(ex.substituto_id, ef.membro_id) AS membro_id
              FROM escala_fixa ef
              LEFT JOIN excecoes ex ON ex.escala_fixa_id = ef.id AND ex.data = $2
             WHERE ef.dia_semana = $3
         ) p
         WHERE membro_id IS NOT NULL`,
        [cultoId, data, diaSemana],
    );
    return result.rows.map((r) => r.membro_id as number);
}
