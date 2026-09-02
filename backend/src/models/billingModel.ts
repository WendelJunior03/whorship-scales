import { query, unscopedQuery } from '../config/database';

export interface BillingOrg {
    id: number;
    nome: string;
    plano: 'free' | 'pro';
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plano_status: string | null;
    plano_ciclo: 'mensal' | 'anual' | null;
    plano_expira_em: Date | null;
}

const CAMPOS = `id, nome, plano, stripe_customer_id, stripe_subscription_id,
                plano_status, plano_ciclo, plano_expira_em`;

/** Estado de billing da org atual — dentro do request (tenant-scoped, RLS ativo). */
export async function buscarBillingDaOrg(orgId: number): Promise<BillingOrg | undefined> {
    const r = await query(`SELECT ${CAMPOS} FROM organizacoes WHERE id = $1`, [orgId]);
    return r.rows[0];
}

/** Salva o customer do Stripe. Chamado no checkout (autenticado) → tenant scope basta. */
export async function salvarCustomer(orgId: number, customerId: string): Promise<void> {
    await query('UPDATE organizacoes SET stripe_customer_id = $1 WHERE id = $2', [customerId, orgId]);
}

/**
 * Busca a org pelo customer do Stripe. Usado pelo WEBHOOK, que NÃO tem contexto de
 * tenant (a chamada vem do Stripe, não de um usuário) → bypass do RLS, igual aos
 * demais fluxos de sistema cross-tenant (ver database.ts / organizacaoModel).
 */
export async function buscarOrgPorCustomer(customerId: string): Promise<BillingOrg | undefined> {
    const r = await unscopedQuery(`SELECT ${CAMPOS} FROM organizacoes WHERE stripe_customer_id = $1`, [customerId]);
    return r.rows[0];
}

export interface EstadoAssinatura {
    plano: 'free' | 'pro';
    subscriptionId: string | null;
    status: string | null;
    ciclo: 'mensal' | 'anual' | null;
    expiraEm: Date | null;
}

/**
 * Aplica o estado da assinatura na org. Chamado pelo WEBHOOK (sistema) → bypass.
 * `plano` é a fonte da verdade que o gating (requerRecurso) lê.
 */
export async function aplicarAssinatura(orgId: number, e: EstadoAssinatura): Promise<void> {
    await unscopedQuery(
        `UPDATE organizacoes
            SET plano = $1, stripe_subscription_id = $2, plano_status = $3,
                plano_ciclo = $4, plano_expira_em = $5
          WHERE id = $6`,
        [e.plano, e.subscriptionId, e.status, e.ciclo, e.expiraEm, orgId],
    );
}
