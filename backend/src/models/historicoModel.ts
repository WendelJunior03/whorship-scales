import { query } from '../config/database';

/**
 * Registra um evento no histórico do culto. `expira_em` = data do culto + 7 dias
 * (calculado no próprio INSERT). Nunca deve quebrar a mutação que a chamou — os
 * controllers envolvem em try/catch. org_id vem do DEFAULT da sessão (RLS).
 */
export async function registrarHistorico(
    cultoId: number,
    atorId: number | null,
    acao: string,
    detalhe: Record<string, unknown> = {},
) {
    await query(
        `INSERT INTO escala_historico (culto_id, ator_id, acao, detalhe, expira_em)
         SELECT $1, $2, $3, $4::jsonb, c.data_hora + interval '7 days'
         FROM cultos c WHERE c.id = $1`,
        [cultoId, atorId, acao, JSON.stringify(detalhe)],
    );
}

/**
 * Lista o histórico de um culto (mais antigo primeiro). Antes, faz a limpeza
 * oportunista dos registros vencidos (sem cron) — restrita à org pela RLS.
 */
export async function listarHistoricoDoCulto(cultoId: number) {
    await query('DELETE FROM escala_historico WHERE expira_em < now()');
    const result = await query(
        `SELECT h.id, h.culto_id, h.ator_id, h.acao, h.detalhe, h.created_at, m.nome AS ator_nome
         FROM escala_historico h
         LEFT JOIN membros m ON m.id = h.ator_id
         WHERE h.culto_id = $1
         ORDER BY h.created_at ASC`,
        [cultoId],
    );
    return result.rows;
}
