import { query } from '../config/database';

// Catálogo de músicas por organização (spec 08). org_id é preenchido pelo DEFAULT/RLS
// (Passo 4) — as queries já saem escopadas na org atual.

export async function criarMusica(nome: string, tomPadrao: string | null, bpm: number | null) {
    const result = await query(
        'INSERT INTO musicas (nome, tom_padrao, bpm) VALUES ($1, $2, $3) RETURNING *',
        [nome, tomPadrao, bpm],
    );
    return result.rows[0];
}

export async function listarMusicas() {
    const result = await query('SELECT * FROM musicas ORDER BY nome ASC');
    return result.rows;
}

export async function buscarMusica(id: number) {
    const result = await query('SELECT * FROM musicas WHERE id = $1', [id]);
    return result.rows[0];
}

export async function atualizarMusica(id: number, nome: string, tomPadrao: string | null, bpm: number | null) {
    const result = await query(
        'UPDATE musicas SET nome = $1, tom_padrao = $2, bpm = $3 WHERE id = $4 RETURNING *',
        [nome, tomPadrao, bpm, id],
    );
    return result.rows[0];
}

export async function apagarMusica(id: number) {
    const result = await query('DELETE FROM musicas WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}
