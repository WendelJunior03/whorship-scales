import { query } from '../config/database';

export type Periodo = 'dia_inteiro' | 'matutino' | 'vespertino' | 'noturno';
export type Recorrencia = 'nenhuma' | 'semanal' | 'mensal';

export interface Indisponibilidade {
    id: number;
    membro_id: number;
    ministerio_id: number | null;
    descricao: string | null;
    periodo: Periodo;
    data_inicio: string; // YYYY-MM-DD
    data_fim: string;
    recorrencia: Recorrencia;
    created_at: string;
}

/**
 * Fragmento SQL (sem `descricao`, que é sensível) para listar. Alias `i`.
 * `to_char` normaliza as datas em ISO (o driver às vezes devolve Date).
 */
const COLUNAS = `i.id, i.membro_id, i.ministerio_id,
    to_char(i.data_inicio, 'YYYY-MM-DD') AS data_inicio,
    to_char(i.data_fim, 'YYYY-MM-DD') AS data_fim,
    i.periodo, i.recorrencia, i.created_at`;

/** Lista por membro. `incluirDescricao` só quando o solicitante pode vê-la. */
export async function listarPorMembro(membroId: number, incluirDescricao: boolean) {
    const extra = incluirDescricao ? ', i.descricao' : '';
    const result = await query(
        `SELECT ${COLUNAS}${extra}
           FROM indisponibilidades i
          WHERE i.membro_id = $1
          ORDER BY i.data_inicio ASC, i.id ASC`,
        [membroId],
    );
    return result.rows;
}

/**
 * Lista de um ministério (todos os membros) — visão de gestão. Traz o nome do
 * membro pra montar o calendário/legenda. `incluirDescricao` idem.
 */
export async function listarPorMinisterio(ministerioId: number, incluirDescricao: boolean) {
    const extra = incluirDescricao ? ', i.descricao' : '';
    const result = await query(
        `SELECT ${COLUNAS}, mb.nome AS membro_nome${extra}
           FROM indisponibilidades i
           JOIN membros mb ON mb.id = i.membro_id
          WHERE i.ministerio_id = $1
          ORDER BY i.data_inicio ASC, i.id ASC`,
        [ministerioId],
    );
    return result.rows;
}

export async function findById(id: number) {
    const result = await query('SELECT * FROM indisponibilidades WHERE id = $1', [id]);
    return result.rows[0];
}

export async function criar(input: {
    membroId: number;
    ministerioId: number | null;
    descricao: string | null;
    periodo: Periodo;
    dataInicio: string;
    dataFim: string;
    recorrencia: Recorrencia;
}) {
    // org_id vem do DEFAULT da sessão (RLS).
    const result = await query(
        `INSERT INTO indisponibilidades
            (membro_id, ministerio_id, descricao, periodo, data_inicio, data_fim, recorrencia)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            input.membroId,
            input.ministerioId,
            input.descricao,
            input.periodo,
            input.dataInicio,
            input.dataFim,
            input.recorrencia,
        ],
    );
    return result.rows[0];
}

export async function atualizar(
    id: number,
    campos: {
        descricao: string | null;
        periodo: Periodo;
        dataInicio: string;
        dataFim: string;
        recorrencia: Recorrencia;
    },
) {
    const result = await query(
        `UPDATE indisponibilidades
            SET descricao = $2, periodo = $3, data_inicio = $4, data_fim = $5, recorrencia = $6
          WHERE id = $1 RETURNING *`,
        [id, campos.descricao, campos.periodo, campos.dataInicio, campos.dataFim, campos.recorrencia],
    );
    return result.rows[0];
}

export async function deletar(id: number) {
    const result = await query('DELETE FROM indisponibilidades WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

/**
 * Predicado SQL: "o membro `<aliasMembroId>` está indisponível no culto cuja data
 * está em `<cultoDataExpr>`" — reaproveitado nos filtros de sugestão de escala.
 * O período do culto casa quando a indisponibilidade é 'dia_inteiro' ou quando a
 * hora do culto cai na janela do período (matutino <12h, vespertino 12–17h,
 * noturno ≥18h). Não usa parâmetros — só interpola expressões SQL já seguras.
 */
export function predicadoIndisponivel(aliasMembroId: string, cultoDataExpr: string): string {
    return `EXISTS (
        SELECT 1 FROM indisponibilidades ind
         WHERE ind.membro_id = ${aliasMembroId}
           AND (${cultoDataExpr})::date BETWEEN ind.data_inicio AND ind.data_fim
           AND (
             ind.periodo = 'dia_inteiro'
             OR (ind.periodo = 'matutino'   AND EXTRACT(HOUR FROM (${cultoDataExpr})) < 12)
             OR (ind.periodo = 'vespertino' AND EXTRACT(HOUR FROM (${cultoDataExpr})) BETWEEN 12 AND 17)
             OR (ind.periodo = 'noturno'    AND EXTRACT(HOUR FROM (${cultoDataExpr})) >= 18)
           )
    )`;
}
