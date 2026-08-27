import { query } from '../config/database';

// Assinaturas = pacotes de vagas extras comprados pela org (módulo 12).
// org_id vem do DEFAULT/RLS.

export async function listarAssinaturas() {
    const result = await query(
        `SELECT a.id, a.plano, a.vagas_total, a.ciclo, a.status, a.provider_ref, a.created_at,
                m.nome AS responsavel_nome
           FROM assinaturas a
           LEFT JOIN membros m ON m.id = a.responsavel_id
          ORDER BY a.created_at DESC`,
    );
    return result.rows;
}

/** Total de vagas extras compradas e ATIVAS (o "pool" distribuível). */
export async function totalVagasCompradas(): Promise<number> {
    const result = await query(
        `SELECT COALESCE(SUM(vagas_total), 0)::int AS total
           FROM assinaturas WHERE status = 'ativa'`,
    );
    return result.rows[0]?.total ?? 0;
}

/** Soma das vagas extras já ALOCADAS entre os ministérios. */
export async function totalVagasAlocadas(): Promise<number> {
    const result = await query(
        `SELECT COALESCE(SUM(vagas_extras), 0)::int AS total FROM ministerios`,
    );
    return result.rows[0]?.total ?? 0;
}

export async function criarAssinatura(input: {
    responsavelId: number | null;
    plano: string | null;
    vagasTotal: number;
    ciclo: 'mensal' | 'anual';
    providerRef: string | null;
}) {
    const result = await query(
        `INSERT INTO assinaturas (responsavel_id, plano, vagas_total, ciclo, provider_ref)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [input.responsavelId, input.plano, input.vagasTotal, input.ciclo, input.providerRef],
    );
    return result.rows[0];
}

export async function buscarAssinatura(id: number) {
    const result = await query('SELECT * FROM assinaturas WHERE id = $1', [id]);
    return result.rows[0];
}

export async function cancelarAssinatura(id: number) {
    const result = await query(
        `UPDATE assinaturas SET status = 'cancelada' WHERE id = $1 RETURNING *`,
        [id],
    );
    return result.rows[0];
}
