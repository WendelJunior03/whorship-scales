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
