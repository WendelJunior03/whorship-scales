import { query } from '../config/database';

export async function createEscalaVocal( 
    membroId: number, 
    cultoId: number) {
        const result = await query('INSERT INTO escala_vocal (membro_id, culto_id) VALUES ($1, $2) RETURNING *', [membroId, cultoId]);
        return result.rows[0];
    }

export async function sugerirVocais(quantidade: number) {
    const result = await query(`SELECT membros.id, membros.nome, MAX(cultos.data_hora) AS ultima_vez FROM membros LEFT JOIN escala_vocal ON membros.id = escala_vocal.membro_id LEFT JOIN cultos ON escala_vocal.culto_id = cultos.id WHERE membros.papel = 'vocal' AND membros.ativo = true GROUP BY membros.id, membros.nome ORDER BY ultima_vez ASC NULLS FIRST LIMIT $1`, [quantidade])

    return result.rows
}

export async function updateStatusEscalaVocal(id: number, status: string) {
    const alteracoes = await query('UPDATE escala_vocal SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return alteracoes.rows[0];
}

export async function findEscalaVocalById(id: number) {
    const result = await query ('SELECT * FROM escala_vocal WHERE id = $1', [id])
    return result.rows[0]
}

export async function findProximoCultoDoMembro(membroId: number) {
    const result = await query(`SELECT cultos.id, cultos.data_hora, cultos.tipo FROM escala_vocal JOIN cultos ON escala_vocal.culto_id = cultos.id WHERE escala_vocal.membro_id = $1 AND cultos.data_hora >= NOW() ORDER BY cultos.data_hora ASC LIMIT 1`, [membroId]);
    return result.rows[0]
}