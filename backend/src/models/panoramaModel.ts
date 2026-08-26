import { query } from '../config/database';

/**
 * Visão de leitura (spec 11, módulo 6): cruza os cultos do mês com as escalas
 * (vocal e avulsa não recusadas). Retorna os cultos (colunas) e as linhas cru
 * (funcao × culto × membro); a montagem da matriz fica no controller.
 * `inicioISO`/`fimISO` = limites do mês.
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
               -- Escala vocal do culto.
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
