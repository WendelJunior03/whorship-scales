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
    const result = await query('SELECT escala_fixa.dia_semana, escala_fixa.funcao, membros.nome FROM escala_fixa JOIN membros ON escala_fixa.membro_id = membros.id WHERE escala_fixa.membro_id = $1', [membroId])
    return result.rows;
}