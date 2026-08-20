import { query } from '../config/database';

// Ministério: sub-entidade da organização (spec 11, módulo 1). `org_id` é preenchido
// pelo DEFAULT/RLS (Passo 4) — todas as queries já saem escopadas na org atual, então
// os models nunca passam org_id à mão.

// --- Ministério ---

export async function criarMinisterio(nome: string, descricao: string | null) {
    const result = await query(
        'INSERT INTO ministerios (nome, descricao) VALUES ($1, $2) RETURNING *',
        [nome, descricao],
    );
    return result.rows[0];
}

// Lista com contagem de membros e total de vagas (para o "x/y membros" da UI).
export async function listarMinisterios() {
    const result = await query(
        `SELECT m.*,
                (SELECT COUNT(*)::int FROM ministerio_membros mm WHERE mm.ministerio_id = m.id) AS total_membros,
                (m.vagas_gratis + m.vagas_extras) AS vagas_total
         FROM ministerios m
         ORDER BY m.nome ASC`,
    );
    return result.rows;
}

export async function buscarMinisterio(id: number) {
    const result = await query(
        `SELECT m.*,
                (SELECT COUNT(*)::int FROM ministerio_membros mm WHERE mm.ministerio_id = m.id) AS total_membros,
                (m.vagas_gratis + m.vagas_extras) AS vagas_total
         FROM ministerios m
         WHERE m.id = $1`,
        [id],
    );
    return result.rows[0];
}

export async function atualizarMinisterio(id: number, nome: string, descricao: string | null) {
    const result = await query(
        'UPDATE ministerios SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
        [nome, descricao, id],
    );
    return result.rows[0];
}

export async function apagarMinisterio(id: number) {
    const result = await query('DELETE FROM ministerios WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

// --- Membros do ministério (vínculo N:N) ---

export async function listarMembros(ministerioId: number) {
    const result = await query(
        `SELECT mb.id, mb.nome, mb.email, mm.papel, mm.created_at,
                COALESCE(
                    (SELECT array_agg(f.nome ORDER BY f.nome)
                     FROM membro_funcoes mf
                     JOIN funcoes f ON f.id = mf.funcao_id
                     WHERE mf.membro_id = mb.id AND mf.ministerio_id = mm.ministerio_id),
                    ARRAY[]::text[]
                ) AS funcoes
         FROM ministerio_membros mm
         JOIN membros mb ON mb.id = mm.membro_id
         WHERE mm.ministerio_id = $1 AND mb.ativo = true
         ORDER BY mb.nome ASC`,
        [ministerioId],
    );
    return result.rows;
}

// Verifica se um membro pertence ao ministério (usado antes de atribuir funções).
export async function membroEstaNoMinisterio(ministerioId: number, membroId: number): Promise<boolean> {
    const result = await query(
        'SELECT 1 FROM ministerio_membros WHERE ministerio_id = $1 AND membro_id = $2',
        [ministerioId, membroId],
    );
    return (result.rowCount ?? 0) > 0;
}

// Nº de membros do ministério (para checar limite de vagas — módulo 12).
export async function contarMembros(ministerioId: number): Promise<number> {
    const result = await query(
        'SELECT COUNT(*)::int AS n FROM ministerio_membros WHERE ministerio_id = $1',
        [ministerioId],
    );
    return result.rows[0].n;
}

// Adiciona (ou atualiza o papel de) um membro no ministério. Upsert idempotente.
export async function adicionarMembro(ministerioId: number, membroId: number, papel: 'administrador' | 'membro') {
    const result = await query(
        `INSERT INTO ministerio_membros (ministerio_id, membro_id, papel)
         VALUES ($1, $2, $3)
         ON CONFLICT (ministerio_id, membro_id) DO UPDATE SET papel = EXCLUDED.papel
         RETURNING *`,
        [ministerioId, membroId, papel],
    );
    return result.rows[0];
}

export async function removerMembro(ministerioId: number, membroId: number) {
    const result = await query(
        'DELETE FROM ministerio_membros WHERE ministerio_id = $1 AND membro_id = $2 RETURNING *',
        [ministerioId, membroId],
    );
    return result.rows[0];
}

// --- Funções do ministério ---

export async function listarFuncoes(ministerioId: number) {
    const result = await query(
        'SELECT * FROM funcoes WHERE ministerio_id = $1 ORDER BY nome ASC',
        [ministerioId],
    );
    return result.rows;
}

export async function criarFuncao(ministerioId: number, nome: string, icone: string | null) {
    const result = await query(
        'INSERT INTO funcoes (ministerio_id, nome, icone) VALUES ($1, $2, $3) RETURNING *',
        [ministerioId, nome, icone],
    );
    return result.rows[0];
}

export async function apagarFuncao(id: number) {
    const result = await query('DELETE FROM funcoes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

// --- Funções exercidas por um membro ---

export async function atribuirFuncao(ministerioId: number, membroId: number, funcaoId: number) {
    const result = await query(
        `INSERT INTO membro_funcoes (membro_id, funcao_id, ministerio_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (membro_id, funcao_id) DO NOTHING
         RETURNING *`,
        [membroId, funcaoId, ministerioId],
    );
    return result.rows[0];
}

export async function removerFuncaoDoMembro(membroId: number, funcaoId: number) {
    const result = await query(
        'DELETE FROM membro_funcoes WHERE membro_id = $1 AND funcao_id = $2 RETURNING *',
        [membroId, funcaoId],
    );
    return result.rows[0];
}

// --- Equipes (agrupamento de membros dentro do ministério) ---

export async function listarEquipes(ministerioId: number) {
    const result = await query(
        `SELECT e.*,
                (SELECT COUNT(*)::int FROM equipe_membros em WHERE em.equipe_id = e.id) AS total_membros
         FROM equipes e
         WHERE e.ministerio_id = $1
         ORDER BY e.nome ASC`,
        [ministerioId],
    );
    return result.rows;
}

export async function criarEquipe(ministerioId: number, nome: string) {
    const result = await query(
        'INSERT INTO equipes (ministerio_id, nome) VALUES ($1, $2) RETURNING *',
        [ministerioId, nome],
    );
    return result.rows[0];
}

export async function apagarEquipe(id: number) {
    const result = await query('DELETE FROM equipes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

// Confirma que a equipe pertence ao ministério (evita cruzar equipes de outro
// ministério da mesma org, que a RLS por org sozinha não separaria).
export async function equipeDoMinisterio(equipeId: number, ministerioId: number): Promise<boolean> {
    const result = await query(
        'SELECT 1 FROM equipes WHERE id = $1 AND ministerio_id = $2',
        [equipeId, ministerioId],
    );
    return (result.rowCount ?? 0) > 0;
}

export async function listarMembrosEquipe(equipeId: number) {
    const result = await query(
        `SELECT mb.id, mb.nome, mb.email
         FROM equipe_membros em
         JOIN membros mb ON mb.id = em.membro_id
         WHERE em.equipe_id = $1 AND mb.ativo = true
         ORDER BY mb.nome ASC`,
        [equipeId],
    );
    return result.rows;
}

export async function adicionarMembroEquipe(equipeId: number, membroId: number) {
    const result = await query(
        `INSERT INTO equipe_membros (equipe_id, membro_id)
         VALUES ($1, $2)
         ON CONFLICT (equipe_id, membro_id) DO NOTHING
         RETURNING *`,
        [equipeId, membroId],
    );
    return result.rows[0];
}

export async function removerMembroEquipe(equipeId: number, membroId: number) {
    const result = await query(
        'DELETE FROM equipe_membros WHERE equipe_id = $1 AND membro_id = $2 RETURNING *',
        [equipeId, membroId],
    );
    return result.rows[0];
}

// --- Classificações (tags do ministério: Titular, Reserva...) ---

export async function listarClassificacoes(ministerioId: number) {
    const result = await query(
        'SELECT * FROM classificacoes WHERE ministerio_id = $1 ORDER BY nome ASC',
        [ministerioId],
    );
    return result.rows;
}

export async function criarClassificacao(ministerioId: number, nome: string, cor: string | null) {
    const result = await query(
        'INSERT INTO classificacoes (ministerio_id, nome, cor) VALUES ($1, $2, $3) RETURNING *',
        [ministerioId, nome, cor],
    );
    return result.rows[0];
}

export async function apagarClassificacao(id: number) {
    const result = await query('DELETE FROM classificacoes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

export async function classificacaoDoMinisterio(classificacaoId: number, ministerioId: number): Promise<boolean> {
    const result = await query(
        'SELECT 1 FROM classificacoes WHERE id = $1 AND ministerio_id = $2',
        [classificacaoId, ministerioId],
    );
    return (result.rowCount ?? 0) > 0;
}

export async function atribuirClassificacao(membroId: number, classificacaoId: number) {
    const result = await query(
        `INSERT INTO membro_classificacao (membro_id, classificacao_id)
         VALUES ($1, $2)
         ON CONFLICT (membro_id, classificacao_id) DO NOTHING
         RETURNING *`,
        [membroId, classificacaoId],
    );
    return result.rows[0];
}

export async function removerClassificacaoDoMembro(membroId: number, classificacaoId: number) {
    const result = await query(
        'DELETE FROM membro_classificacao WHERE membro_id = $1 AND classificacao_id = $2 RETURNING *',
        [membroId, classificacaoId],
    );
    return result.rows[0];
}
