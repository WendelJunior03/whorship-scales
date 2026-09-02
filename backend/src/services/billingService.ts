import Stripe from 'stripe';
import { stripe, billingConfig, cicloDoPreco } from '../config/stripe';
import * as billingModel from '../models/billingModel';

/** Erro de billing com status HTTP sugerido (o controller traduz pra resposta). */
export class BillingError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

function exigirStripe(): Stripe {
    if (!stripe) {
        throw new BillingError(503, 'Billing não configurado no servidor.');
    }
    return stripe;
}

/**
 * Deriva o estado do nosso plano a partir de uma Subscription do Stripe. PURA (sem
 * rede) de propósito, pra ser testável. Regras:
 *  - active/trialing/past_due → PRO (past_due mantém acesso em carência);
 *  - qualquer outro (canceled, unpaid, incomplete_expired, …) → FREE.
 */
export function estadoDaSubscription(sub: Stripe.Subscription): billingModel.EstadoAssinatura {
    const item = sub.items.data[0];
    const status = sub.status;
    const ativo = status === 'active' || status === 'trialing' || status === 'past_due';
    const fimSeg = item?.current_period_end;
    return {
        plano: ativo ? 'pro' : 'free',
        subscriptionId: sub.id,
        status,
        ciclo: cicloDoPreco(item?.price.id),
        expiraEm: typeof fimSeg === 'number' ? new Date(fimSeg * 1000) : null,
    };
}

/** Garante um customer do Stripe para a org (cria e persiste na primeira vez). */
async function obterOuCriarCustomer(org: billingModel.BillingOrg, email?: string): Promise<string> {
    if (org.stripe_customer_id) return org.stripe_customer_id;
    const s = exigirStripe();
    const customer = await s.customers.create({
        name: org.nome,
        ...(email ? { email } : {}),
        metadata: { org_id: String(org.id) },
    });
    await billingModel.salvarCustomer(org.id, customer.id);
    return customer.id;
}

/** Cria a sessão de Checkout (assinatura PRO mensal/anual) e devolve a URL. */
export async function criarCheckout(input: {
    orgId: number;
    ciclo: 'mensal' | 'anual';
    email?: string;
}): Promise<string> {
    const s = exigirStripe();
    const preco = input.ciclo === 'anual' ? billingConfig.precoAnual : billingConfig.precoMensal;
    if (!preco) throw new BillingError(503, 'Preço do plano não configurado.');

    const org = await billingModel.buscarBillingDaOrg(input.orgId);
    if (!org) throw new BillingError(404, 'Organização não encontrada.');

    const customer = await obterOuCriarCustomer(org, input.email);
    const session = await s.checkout.sessions.create({
        mode: 'subscription',
        customer,
        client_reference_id: String(org.id),
        line_items: [{ price: preco, quantity: 1 }],
        subscription_data: { metadata: { org_id: String(org.id) } },
        success_url: billingConfig.successUrl,
        cancel_url: billingConfig.cancelUrl,
        locale: 'pt-BR',
        allow_promotion_codes: true,
    });
    if (!session.url) throw new BillingError(502, 'Stripe não retornou a URL de checkout.');
    return session.url;
}

/** Cria a sessão do Portal de Cobrança (gerenciar/cancelar assinatura). */
export async function criarPortal(orgId: number): Promise<string> {
    const s = exigirStripe();
    const org = await billingModel.buscarBillingDaOrg(orgId);
    if (!org?.stripe_customer_id) {
        throw new BillingError(409, 'Nenhuma assinatura para gerenciar ainda.');
    }
    const portal = await s.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: billingConfig.successUrl,
    });
    return portal.url;
}

/** Verifica a assinatura do webhook e devolve o evento tipado (lança se inválido). */
export function construirEvento(corpoCru: Buffer, assinatura: string | undefined): Stripe.Event {
    const s = exigirStripe();
    if (!billingConfig.webhookSecret) {
        throw new BillingError(503, 'Webhook secret não configurado.');
    }
    if (!assinatura) throw new BillingError(400, 'Assinatura do webhook ausente.');
    try {
        return s.webhooks.constructEvent(corpoCru, assinatura, billingConfig.webhookSecret);
    } catch {
        throw new BillingError(400, 'Assinatura do webhook inválida.');
    }
}

/** Descobre a org de uma Subscription: metadata.org_id ou o customer vinculado. */
async function resolverOrgId(sub: Stripe.Subscription): Promise<number | null> {
    const daMeta = Number(sub.metadata?.org_id);
    if (Number.isInteger(daMeta) && daMeta > 0) return daMeta;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const org = await billingModel.buscarOrgPorCustomer(customerId);
    return org?.id ?? null;
}

/** Aplica um evento do Stripe no plano da org. Idempotente (sempre reflete o estado). */
export async function processarEvento(event: Stripe.Event): Promise<void> {
    const s = exigirStripe();
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const orgId = Number(session.client_reference_id);
            if (!Number.isInteger(orgId) || orgId <= 0 || !session.subscription) break;
            const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
            const sub = await s.subscriptions.retrieve(subId);
            await billingModel.aplicarAssinatura(orgId, estadoDaSubscription(sub));
            break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const sub = event.data.object;
            const orgId = await resolverOrgId(sub);
            if (!orgId) break;
            const estado = event.type === 'customer.subscription.deleted'
                ? { plano: 'free' as const, subscriptionId: sub.id, status: sub.status, ciclo: null, expiraEm: null }
                : estadoDaSubscription(sub);
            await billingModel.aplicarAssinatura(orgId, estado);
            break;
        }
        default:
            // Outros eventos não afetam o plano — ignora (webhook responde 200).
            break;
    }
}
