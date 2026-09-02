import { query, unscopedQuery } from '../config/database';

export interface ApiTokenResumo {
    id: number;
    nome: string;
    prefixo: string;
    ministerio_id: number | null;
    ultimo_uso_em: Date | null;
    created_at: Date;
}

/** Lista os tokens da org (sem o hash, nunca o valor). Tenant-scoped (RLS). */
export async function listarTokens(): Promise<ApiTokenResumo[]> {
    const r = await query(
        `SELECT id, nome, prefixo, ministerio_id, ultimo_uso_em, created_at
           FROM api_tokens ORDER BY created_at DESC`,
    );
    return r.rows;
}

export async function criarToken(input: {
    nome: string;
    hash: string;
    prefixo: string;
    ministerioId: number | null;
    criadoPor: number | null;
}): Promise<ApiTokenResumo> {
    const r = await query(
        `INSERT INTO api_tokens (nome, token_hash, prefixo, ministerio_id, criado_por)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nome, prefixo, ministerio_id, ultimo_uso_em, created_at`,
        [input.nome, input.hash, input.prefixo, input.ministerioId, input.criadoPor],
    );
    return r.rows[0];
}

export async function revogarToken(id: number): Promise<boolean> {
    const r = await query('DELETE FROM api_tokens WHERE id = $1 RETURNING id', [id]);
    return (r.rowCount ?? 0) > 0;
}

/**
 * Autenticação da API externa: busca o token pelo hash SEM contexto de tenant
 * (a chamada vem de fora, com Bearer) → bypass do RLS. Devolve org/ministério pra
 * então rodar o resto já escopado por org.
 */
export async function buscarPorHash(
    hash: string,
): Promise<{ id: number; org_id: number; ministerio_id: number | null } | undefined> {
    const r = await unscopedQuery(
        'SELECT id, org_id, ministerio_id FROM api_tokens WHERE token_hash = $1',
        [hash],
    );
    return r.rows[0];
}

/** Marca o último uso do token (best-effort, via bypass — sem tenant na auth). */
export async function marcarUso(id: number): Promise<void> {
    await unscopedQuery('UPDATE api_tokens SET ultimo_uso_em = now() WHERE id = $1', [id]);
}
