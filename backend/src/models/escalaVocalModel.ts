import { query } from '../config/database';
import { predicadoIndisponivel } from './indisponibilidadeModel';

export async function createEscalaVocal( 
    membroId: number, 
    cultoId: number) {
        const result = await query('INSERT INTO escala_vocal (membro_id, culto_id) VALUES ($1, $2) RETURNING *', [membroId, cultoId]);
        return result.rows[0];
    }

export async function sugerirVocais(quantidade: number, cultoId: number) {
    // Quem recusou libera a vaga de novo pra sugestão — só quem está de fato
    // na equipe (pendente ou confirmado) fica de fora da lista de sugeridos.
    // Também exclui quem marcou indisponibilidade na data/período do culto (mód. 7).
    const indisponivel = predicadoIndisponivel('membros.id', '(SELECT data_hora FROM cultos WHERE id = $2)');
    const result = await query(`SELECT membros.id, membros.nome, MAX(cultos.data_hora) AS ultima_vez FROM membros LEFT JOIN escala_vocal ON membros.id = escala_vocal.membro_id LEFT JOIN cultos ON escala_vocal.culto_id = cultos.id WHERE membros.papel = 'vocal' AND membros.ativo = true AND membros.id NOT IN (SELECT membro_id FROM escala_vocal WHERE culto_id = $2 AND status <> 'recusado') AND NOT ${indisponivel} GROUP BY membros.id, membros.nome ORDER BY ultima_vez ASC NULLS FIRST LIMIT $1`, [quantidade, cultoId])

    return result.rows
}

export async function updateStatusEscalaVocal(id: number, status: string) {
    // confirmado_em guarda o momento da confirmação; ao sair de 'confirmado' (recusa/falta/
    // pendente) o rastro é limpo pra não ficar inconsistente.
    const alteracoes = await query(
        `UPDATE escala_vocal
            SET status = $1,
                confirmado_em = CASE WHEN $1 = 'confirmado' THEN now() ELSE NULL END
          WHERE id = $2 RETURNING *`,
        [status, id],
    );
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

export async function findEscalaVocalByCultoId(cultoId: number) {
    const result = await query(`SELECT escala_vocal.id, escala_vocal.membro_id, escala_vocal.status, membros.nome, membros.foto_url AS foto FROM escala_vocal JOIN membros ON escala_vocal.membro_id = membros.id WHERE escala_vocal.culto_id = $1`, [cultoId]);
    return result.rows;
}

export async function findMinhaEscalaVocal(membroId: number) {
    const result = await query(`SELECT escala_vocal.id, escala_vocal.status, cultos.id AS culto_id, cultos.data_hora, cultos.tipo FROM escala_vocal JOIN cultos ON escala_vocal.culto_id = cultos.id WHERE escala_vocal.membro_id = $1 ORDER BY cultos.data_hora ASC`, [membroId]);
    return result.rows;
}

export async function deleteEscalaVocal(id: number) {
    const result = await query('DELETE FROM escala_vocal WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}