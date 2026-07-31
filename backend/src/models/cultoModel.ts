import { query } from '../config/database';

export async function findCultoById(id: number) {
    const result = await query('SELECT * FROM cultos WHERE id = $1', [id]);
    return result.rows[0];
}

export async function createCulto(dataHora: string, tipo: string | null) {
    const result = await query('INSERT INTO cultos (data_hora, tipo) VALUES ($1, $2) RETURNING *', [dataHora, tipo]);
    return result.rows[0];
}