import { query } from '../config/database';

export async function createEnsaio(cultoId: number, dataHora: string, observacoes: string | null) {
    const result = await query('INSERT INTO ensaios (culto_id, data_hora, observacoes) VALUES ($1, $2, $3) RETURNING *', [cultoId, dataHora, observacoes]);
    return result.rows[0];
}

export async function findEnsaioByCultoId(cultoId: number) {
    const result = await query('SELECT * FROM ensaios WHERE culto_id = $1', [cultoId]);
    return result.rows[0];
}

export async function findEnsaioById(id: number) {
    const result = await query('SELECT * FROM ensaios WHERE id = $1', [id]);
    return result.rows[0];
}

export async function updateEnsaio(id: number, dataHora: string, observacoes: string | null) {
    const result = await query('UPDATE ensaios SET data_hora = $1, observacoes = $2 WHERE id = $3 RETURNING *', [dataHora, observacoes, id]);
    return result.rows[0];
}

export async function deleteEnsaio(id: number) {
    await query('DELETE FROM ensaio_participantes WHERE ensaio_id = $1', [id]);
    const result = await query('DELETE FROM ensaios WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

export async function createEnsaioParticipante(ensaioId: number, membroId: number) {
    const result = await query('INSERT INTO ensaio_participantes (ensaio_id, membro_id) VALUES ($1, $2) RETURNING *', [ensaioId, membroId]);
    return result.rows[0];
}

export async function findParticipantesByEnsaioId(ensaioId: number) {
    const result = await query(
        `SELECT ensaio_participantes.id, ensaio_participantes.membro_id, ensaio_participantes.status, membros.nome
           FROM ensaio_participantes
           JOIN membros ON ensaio_participantes.membro_id = membros.id
          WHERE ensaio_participantes.ensaio_id = $1`,
        [ensaioId],
    );
    return result.rows;
}

export async function findEnsaioParticipanteById(id: number) {
    const result = await query('SELECT * FROM ensaio_participantes WHERE id = $1', [id]);
    return result.rows[0];
}

export async function updateStatusEnsaioParticipante(id: number, status: string) {
    // Mesma regra de escala_vocal/avulsa: confirmado_em só fica preenchido enquanto status = 'confirmado'.
    const result = await query(
        `UPDATE ensaio_participantes
            SET status = $1,
                confirmado_em = CASE WHEN $1 = 'confirmado' THEN now() ELSE NULL END
          WHERE id = $2 RETURNING *`,
        [status, id],
    );
    return result.rows[0];
}

export async function deleteEnsaioParticipante(id: number) {
    const result = await query('DELETE FROM ensaio_participantes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

export async function findMinhasParticipacoesEnsaio(membroId: number) {
    const result = await query(
        `SELECT ensaio_participantes.id, ensaio_participantes.status,
                ensaios.id AS ensaio_id, ensaios.data_hora, ensaios.observacoes, ensaios.culto_id
           FROM ensaio_participantes
           JOIN ensaios ON ensaio_participantes.ensaio_id = ensaios.id
          WHERE ensaio_participantes.membro_id = $1
          ORDER BY ensaios.data_hora ASC`,
        [membroId],
    );
    return result.rows;
}
