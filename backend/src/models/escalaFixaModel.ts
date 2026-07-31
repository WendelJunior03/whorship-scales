import { query } from '../config/database';

export async function createEscalaFixa(
    membroId: number, 
    diaSemana: string,
    funcao: string) {

    const result = await query('INSERT INTO escala_fixa (membro_id, dia_semana, funcao) VALUES ($1, $2, $3) RETURNING *', [membroId, diaSemana, funcao]);

    return result.rows[0];

}

export async function findEscalaFixaMontada() {
    const result = await query('SELECT escala_fixa.dia_semana, escala_fixa.funcao, membros.nome FROM escala_fixa JOIN membros ON escala_fixa.membro_id = membros.id');
    return result.rows;
}

export async function findMyEscalaFixa(membroId: number) {
    const result = await query('SELECT escala_fixa.id, escala_fixa.dia_semana, escala_fixa.funcao, membros.nome FROM escala_fixa JOIN membros ON escala_fixa.membro_id = membros.id WHERE escala_fixa.membro_id = $1', [membroId])
    return result.rows;
}

export async function findEscalaFixaById(id: number) {
    const result = await query('SELECT * FROM escala_fixa WHERE id = $1', [id])
    return result.rows[0];
}

const diaSemanaPorIndice: Record<number, string> = {
    0: 'domingo',
    3: 'quarta',
    6: 'sabado',
};

export async function findEscalaEfetiva(data: string) {
    const diaSemana = diaSemanaPorIndice[new Date(data).getUTCDay()];

    if (!diaSemana) {
        return [];
    }

    const result = await query(`SELECT escala_fixa.id AS escala_fixa_id, escala_fixa.dia_semana, escala_fixa.funcao, COALESCE(membro_substituto.nome, membro_original.nome) AS quem_toca FROM escala_fixa LEFT JOIN excecoes ON escala_fixa.id = excecoes.escala_fixa_id AND excecoes.data = $1 LEFT JOIN membros AS membro_original ON escala_fixa.membro_id = membro_original.id LEFT JOIN membros AS membro_substituto ON excecoes.substituto_id = membro_substituto.id WHERE escala_fixa.dia_semana = $2`, [data, diaSemana])
    return result.rows;
}

/**
 * Próximo culto (data futura) cujo dia da semana bate com algum vínculo
 * de escala_fixa do membro, pulando datas em que ele já tem uma exceção
 * registrada (ou seja, não é ele quem toca naquele dia específico).
 */
export async function findProximoCultoFixaDoMembro(membroId: number) {
    const result = await query(`
        SELECT cultos.id, cultos.data_hora, cultos.tipo
        FROM cultos
        JOIN escala_fixa ON escala_fixa.membro_id = $1
        WHERE cultos.data_hora >= NOW()
        AND (
            (escala_fixa.dia_semana = 'domingo' AND EXTRACT(DOW FROM cultos.data_hora) = 0) OR
            (escala_fixa.dia_semana = 'quarta' AND EXTRACT(DOW FROM cultos.data_hora) = 3) OR
            (escala_fixa.dia_semana = 'sabado' AND EXTRACT(DOW FROM cultos.data_hora) = 6)
        )
        AND NOT EXISTS (
            SELECT 1 FROM excecoes
            WHERE excecoes.escala_fixa_id = escala_fixa.id
            AND excecoes.data = cultos.data_hora::date
        )
        ORDER BY cultos.data_hora ASC
        LIMIT 1
    `, [membroId]);
    return result.rows[0];
}
