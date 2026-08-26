import { query } from '../config/database';

export async function findCultoById(id: number) {
    const result = await query('SELECT * FROM cultos WHERE id = $1', [id]);
    return result.rows[0];
}

export async function findAllCultos() {
    const result = await query('SELECT * FROM cultos ORDER BY data_hora ASC');
    return result.rows;
}

export async function createCulto(dataHora: string, tipo: string | null) {
    const result = await query('INSERT INTO cultos (data_hora, tipo) VALUES ($1, $2) RETURNING *', [dataHora, tipo]);
    return result.rows[0];
}

/**
 * Apaga o culto e tudo que depende dele (repertório, escala de vocal e
 * avulsa vinculados, ensaio se tiver um).
 */
export async function deleteCulto(id: number) {
    await query('DELETE FROM repertorio WHERE culto_id = $1', [id]);
    await query('DELETE FROM escala_vocal WHERE culto_id = $1', [id]);
    await query('DELETE FROM escala_avulsa WHERE culto_id = $1', [id]);
    await query('DELETE FROM ensaio_participantes WHERE ensaio_id IN (SELECT id FROM ensaios WHERE culto_id = $1)', [id]);
    await query('DELETE FROM ensaios WHERE culto_id = $1', [id]);
    const result = await query('DELETE FROM cultos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}