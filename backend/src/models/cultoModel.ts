import { query } from '../config/database';

export async function findCultoById(id: number) {
    const result = await query('SELECT * FROM cultos WHERE id = $1', [id]);
    return result.rows[0];
}

export async function findAllCultos() {
    const result = await query('SELECT * FROM cultos ORDER BY data_hora ASC');
    return result.rows;
}

/**
 * Resumo dos cultos para a lista de escalas: por culto, os participantes (vocal +
 * avulsa não recusados, p/ avatares), a situação do próprio usuário (`minha_situacao`),
 * e as contagens de músicas e comentários. Tudo escopado por org via RLS.
 */
export async function findResumoCultos(usuarioId: number) {
    const result = await query(
        `SELECT c.id, c.data_hora, c.tipo,
                (SELECT count(*) FROM repertorio r WHERE r.culto_id = c.id)::int AS total_musicas,
                (SELECT count(*) FROM escala_comentarios ec WHERE ec.culto_id = c.id)::int AS total_comentarios,
                COALESCE((
                    SELECT json_agg(json_build_object('membro_id', p.membro_id, 'nome', p.nome) ORDER BY p.nome)
                    FROM (
                        SELECT ev.membro_id, m.nome
                          FROM escala_vocal ev JOIN membros m ON m.id = ev.membro_id
                         WHERE ev.culto_id = c.id AND ev.status <> 'recusado'
                        UNION
                        SELECT ea.membro_id, m.nome
                          FROM escala_avulsa ea JOIN membros m ON m.id = ea.membro_id
                         WHERE ea.culto_id = c.id AND ea.status <> 'recusado'
                    ) p
                ), '[]'::json) AS participantes,
                (
                    SELECT CASE
                        WHEN bool_or(s.status = 'confirmado') THEN 'confirmado'
                        WHEN bool_or(s.status = 'pendente')   THEN 'pendente'
                        ELSE NULL
                    END
                    FROM (
                        SELECT status FROM escala_vocal  WHERE culto_id = c.id AND membro_id = $1
                        UNION ALL
                        SELECT status FROM escala_avulsa WHERE culto_id = c.id AND membro_id = $1
                    ) s
                ) AS minha_situacao
           FROM cultos c
          ORDER BY c.data_hora ASC`,
        [usuarioId],
    );
    return result.rows;
}

export async function createCulto(dataHora: string, tipo: string | null) {
    const result = await query('INSERT INTO cultos (data_hora, tipo) VALUES ($1, $2) RETURNING *', [dataHora, tipo]);
    return result.rows[0];
}

/**
 * Apaga o culto e tudo que depende dele (repertório, escala de vocal e
 * avulsa vinculados, ensaio se tiver um).
 */
export async function deleteCulto(id: number) {
    await query('DELETE FROM repertorio WHERE culto_id = $1', [id]);
    await query('DELETE FROM escala_vocal WHERE culto_id = $1', [id]);
    await query('DELETE FROM escala_avulsa WHERE culto_id = $1', [id]);
    await query('DELETE FROM ensaio_participantes WHERE ensaio_id IN (SELECT id FROM ensaios WHERE culto_id = $1)', [id]);
    await query('DELETE FROM ensaios WHERE culto_id = $1', [id]);
    const result = await query('DELETE FROM cultos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}