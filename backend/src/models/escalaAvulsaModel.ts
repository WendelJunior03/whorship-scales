import { query } from '../config/database';

export async function createEscalaAvulsa(membroId: number, cultoId: number, funcao: string) {
    const result = await query('INSERT INTO escala_avulsa (membro_id, culto_id, funcao) VALUES ($1, $2, $3) RETURNING *', [membroId, cultoId, funcao]);
    return result.rows[0];
}

export async function findEscalaAvulsaByCultoId(cultoId: number) {
    const result = await query(`SELECT escala_avulsa.id, escala_avulsa.membro_id, escala_avulsa.funcao, escala_avulsa.status, membros.nome FROM escala_avulsa JOIN membros ON escala_avulsa.membro_id = membros.id WHERE escala_avulsa.culto_id = $1`, [cultoId]);
    return result.rows;
}

export async function findEscalaAvulsaById(id: number) {
    const result = await query('SELECT * FROM escala_avulsa WHERE id = $1', [id]);
    return result.rows[0];
}

export async function updateStatusEscalaAvulsa(id: number, status: string) {
    const result = await query('UPDATE escala_avulsa SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0];
}

export async function findMinhaEscalaAvulsa(membroId: number) {
    const result = await query(`SELECT escala_avulsa.id, escala_avulsa.status, escala_avulsa.funcao, cultos.id AS culto_id, cultos.data_hora, cultos.tipo FROM escala_avulsa JOIN cultos ON escala_avulsa.culto_id = cultos.id WHERE escala_avulsa.membro_id = $1 ORDER BY cultos.data_hora ASC`, [membroId]);
    return result.rows;
}

export async function deleteEscalaAvulsa(id: number) {
    const result = await query('DELETE FROM escala_avulsa WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

export async function findProximoCultoAvulsaDoMembro(membroId: number) {
    const result = await query(`SELECT cultos.id, cultos.data_hora, cultos.tipo FROM escala_avulsa JOIN cultos ON escala_avulsa.culto_id = cultos.id WHERE escala_avulsa.membro_id = $1 AND cultos.data_hora >= NOW() ORDER BY cultos.data_hora ASC LIMIT 1`, [membroId]);
    return result.rows[0];
}