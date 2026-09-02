import Stripe from 'stripe';
import 'dotenv/config';

// Instância única do Stripe. Sandbox-first: em dev/CI sem chave, fica `null` e os
// endpoints de billing respondem 503 — o app sobe normalmente sem Stripe. As
// chaves de PRODUÇÃO (go-live) ficam com o dono, fora do repositório.
const chaveSecreta = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = chaveSecreta ? new Stripe(chaveSecreta) : null;

export const billingConfig = {
    precoMensal: process.env.STRIPE_PRICE_PRO_MENSAL ?? '',
    precoAnual: process.env.STRIPE_PRICE_PRO_ANUAL ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    // Para onde o Stripe redireciona depois do checkout/portal (frontend).
    successUrl: process.env.BILLING_SUCCESS_URL ?? 'http://localhost:8081/assinaturas?checkout=sucesso',
    cancelUrl: process.env.BILLING_CANCEL_URL ?? 'http://localhost:8081/assinaturas?checkout=cancelado',
};

/** Billing só opera com chave + os dois preços (mensal/anual) configurados. */
export function billingConfigurado(): boolean {
    return !!stripe && !!billingConfig.precoMensal && !!billingConfig.precoAnual;
}

/** Mapeia um price id do Stripe para o ciclo do nosso plano. */
export function cicloDoPreco(priceId: string | undefined): 'mensal' | 'anual' | null {
    if (!priceId) return null;
    if (priceId === billingConfig.precoAnual) return 'anual';
    if (priceId === billingConfig.precoMensal) return 'mensal';
    return null;
}
