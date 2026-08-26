import { query } from '../config/database';

/**
 * Visão de leitura (spec 11, módulo 6): cruza os cultos do mês com as escalas
 * (fixa efetiva do dia — com substituição —, vocal e avulsa não recusadas).
 * Retorna os cultos (colunas) e as linhas cru (funcao × culto × membro); a
 * montagem da matriz fica no controller. `inicioISO`/`fimISO` = limites do mês.
 */
export async function getPanorama(inicioISO: string, fimISO: string) {
    const cultos = (
        await query(
            `SELECT id, data_hora FROM cultos
              WHERE data_hora >= $1 AND data_hora < $2
              ORDER BY data_hora ASC`,
            [inicioISO, fimISO],
        )
    ).rows;

    const linhas = (
        await query(
            `SELECT culto_id, funcao, membro_id, nome FROM (
               -- Escala fixa: recorrente por dia da semana, resolvendo substituição por exceção.
               SELECT c.id AS culto_id, ef.funcao AS funcao,
                      COALESCE(ex.substituto_id, ef.membro_id) AS membro_id,
                      COALESCE(sub.nome, orig.nome) AS nome,
                      c.data_hora
                 FROM cultos c
                 JOIN escala_fixa ef ON ef.dia_semana = CASE EXTRACT(DOW FROM (c.data_hora AT TIME ZONE 'UTC'))::int
                     WHEN 0 THEN 'domingo' WHEN 3 THEN 'quarta' WHEN 6 THEN 'sabado' END
                 LEFT JOIN excecoes ex ON ex.escala_fixa_id = ef.id AND ex.data = (c.data_hora AT TIME ZONE 'UTC')::date
                 LEFT JOIN membros orig ON orig.id = ef.membro_id
                 LEFT JOIN membros sub  ON sub.id = ex.substituto_id
                WHERE c.data_hora >= $1 AND c.data_hora < $2
                  AND COALESCE(ex.substituto_id, ef.membro_id) IS NOT NULL

               UNION ALL
               SELECT ev.culto_id, 'Vocal' AS funcao, ev.membro_id, m.nome, c.data_hora
                 FROM escala_vocal ev
                 JOIN membros m ON m.id = ev.membro_id
                 JOIN cultos c  ON c.id = ev.culto_id
                WHERE c.data_hora >= $1 AND c.data_hora < $2 AND ev.status <> 'recusado'

               UNION ALL
               SELECT ea.culto_id, ea.funcao, ea.membro_id, m.nome, c.data_hora
                 FROM escala_avulsa ea
                 JOIN membros m ON m.id = ea.membro_id
                 JOIN cultos c  ON c.id = ea.culto_id
                WHERE c.data_hora >= $1 AND c.data_hora < $2 AND ea.status <> 'recusado'
             ) t
             ORDER BY funcao, data_hora`,
            [inicioISO, fimISO],
        )
    ).rows;

    return { cultos, linhas };
}
