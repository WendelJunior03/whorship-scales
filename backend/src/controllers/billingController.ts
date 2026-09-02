import { Request, Response } from 'express';
import * as billing from '../services/billingService';
import * as billingModel from '../models/billingModel';
import { billingConfigurado } from '../config/stripe';

function tratarErro(res: Response, err: unknown) {
    if (err instanceof billing.BillingError) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error('[billing]', err);
    return res.status(500).json({ message: 'Erro ao processar billing.' });
}

/** GET /billing — estado do plano da org (pra montar a tela "Meu plano"). */
export async function statusController(req: Request, res: Response) {
    if (!req.orgId) return res.status(401).json({ message: 'Não autenticado!' });
    const org = await billingModel.buscarBillingDaOrg(req.orgId);
    if (!org) return res.status(404).json({ message: 'Organização não encontrada!' });
    return res.status(200).json({
        plano: org.plano,
        status: org.plano_status,
        ciclo: org.plano_ciclo,
        expiraEm: org.plano_expira_em,
        temAssinatura: !!org.stripe_customer_id,
        billingConfigurado: billingConfigurado(),
    });
}

/** POST /billing/checkout { ciclo } — inicia a assinatura PRO; devolve a URL do Stripe. */
export async function checkoutController(req: Request, res: Response) {
    if (!req.orgId) return res.status(401).json({ message: 'Não autenticado!' });
    const ciclo = req.body?.ciclo === 'anual' ? 'anual' : 'mensal';
    try {
        const url = await billing.criarCheckout({
            orgId: req.orgId,
            ciclo,
            ...(req.user?.email ? { email: req.user.email } : {}),
        });
        return res.status(200).json({ url });
    } catch (err) {
        return tratarErro(res, err);
    }
}

/** POST /billing/portal — abre o Portal de Cobrança pra gerenciar/cancelar. */
export async function portalController(req: Request, res: Response) {
    if (!req.orgId) return res.status(401).json({ message: 'Não autenticado!' });
    try {
        const url = await billing.criarPortal(req.orgId);
        return res.status(200).json({ url });
    } catch (err) {
        return tratarErro(res, err);
    }
}

/**
 * POST /billing/webhook — recebe eventos do Stripe. SEM auth (a autenticação é a
 * assinatura HMAC do corpo). Montado com express.raw ANTES do express.json, então
 * req.body é um Buffer. Responde 200 rápido para o Stripe não re-tentar à toa.
 */
export async function webhookController(req: Request, res: Response) {
    let event;
    try {
        event = billing.construirEvento(req.body as Buffer, req.header('stripe-signature'));
    } catch (err) {
        if (err instanceof billing.BillingError) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(400).json({ message: 'Webhook inválido.' });
    }
    try {
        await billing.processarEvento(event);
    } catch (err) {
        // Falha ao aplicar → 500 faz o Stripe re-tentar (entrega é retriável).
        console.error('[billing:webhook]', err);
        return res.status(500).json({ received: false });
    }
    return res.status(200).json({ received: true });
}
