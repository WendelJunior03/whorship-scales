import { query } from '../config/database';

export async function createExcecao(
    escalaFixaId: number, 
    data: string,
    substitutoId?: number | null) {

    const result = await query('INSERT INTO excecoes (escala_fixa_id, data, substituto_id) VALUES ($1, $2, $3) RETURNING *', [escalaFixaId, data, substitutoId]);

    return result.rows[0];

}   