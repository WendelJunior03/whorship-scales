import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { estadoDaSubscription } from './billingService';

// Monta uma Subscription mínima do Stripe (só o que o mapeamento lê).
function fakeSub(over: {
    status?: Stripe.Subscription.Status;
    priceId?: string;
    fim?: number | undefined;
} = {}): Stripe.Subscription {
    return {
        id: 'sub_123',
        status: over.status ?? 'active',
        customer: 'cus_123',
        metadata: {},
        items: {
            data: [{
                price: { id: over.priceId ?? 'price_x' },
                current_period_end: 'fim' in over ? over.fim : 1_893_456_000, // 2030-01-01
            }],
        },
    } as unknown as Stripe.Subscription;
}

describe('estadoDaSubscription', () => {
    it('status active vira plano pro com data de expiração', () => {
        const e = estadoDaSubscription(fakeSub({ status: 'active', fim: 1_893_456_000 }));
        expect(e.plano).toBe('pro');
        expect(e.status).toBe('active');
        expect(e.subscriptionId).toBe('sub_123');
        expect(e.expiraEm).toEqual(new Date(1_893_456_000 * 1000));
    });

    it('trialing e past_due mantêm PRO (carência)', () => {
        expect(estadoDaSubscription(fakeSub({ status: 'trialing' })).plano).toBe('pro');
        expect(estadoDaSubscription(fakeSub({ status: 'past_due' })).plano).toBe('pro');
    });

    it('canceled/unpaid derrubam para free', () => {
        expect(estadoDaSubscription(fakeSub({ status: 'canceled' })).plano).toBe('free');
        expect(estadoDaSubscription(fakeSub({ status: 'unpaid' })).plano).toBe('free');
    });

    it('sem current_period_end → expiraEm nulo', () => {
        expect(estadoDaSubscription(fakeSub({ fim: undefined })).expiraEm).toBeNull();
    });

    it('mapeia o ciclo pelo price id configurado no ambiente', async () => {
        vi.resetModules();
        vi.stubEnv('STRIPE_PRICE_PRO_MENSAL', 'price_mensal');
        vi.stubEnv('STRIPE_PRICE_PRO_ANUAL', 'price_anual');
        const svc = await import('./billingService');
        expect(svc.estadoDaSubscription(fakeSub({ priceId: 'price_anual' })).ciclo).toBe('anual');
        expect(svc.estadoDaSubscription(fakeSub({ priceId: 'price_mensal' })).ciclo).toBe('mensal');
        expect(svc.estadoDaSubscription(fakeSub({ priceId: 'price_outro' })).ciclo).toBeNull();
        vi.unstubAllEnvs();
    });
});
