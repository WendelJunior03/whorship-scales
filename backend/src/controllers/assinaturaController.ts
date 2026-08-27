import { Request, Response } from 'express';
import * as model from '../models/assinaturaModel';
import * as ministerioModel from '../models/ministerioModel';

/**
 * GET /assinaturas — pacotes comprados + resumo do pool de vagas extras
 * (comprado / alocado / disponível) e os ministérios com seu uso (x/y).
 */
export async function listarAssinaturasController(_req: Request, res: Response) {
    const [assinaturas, comprado, alocado, ministerios] = await Promise.all([
        model.listarAssinaturas(),
        model.totalVagasCompradas(),
        model.totalVagasAlocadas(),
        ministerioModel.listarMinisterios(),
    ]);
    return res.status(200).json({
        assinaturas,
        resumo: { comprado, alocado, disponivel: comprado - alocado },
        ministerios,
    });
}

/**
 * POST /assinaturas — registra um pacote de vagas (STUB: sem gateway de pagamento
 * ainda; entra como 'ativa' pra já poder distribuir). Só admin.
 */
export async function criarAssinaturaController(req: Request, res: Response) {
    const vagasTotal = Number(req.body?.vagasTotal);
    if (!Number.isInteger(vagasTotal) || vagasTotal <= 0) {
        return res.status(400).json({ message: 'vagasTotal deve ser um inteiro positivo!' });
    }
    const ciclo = req.body?.ciclo === 'anual' ? 'anual' : 'mensal';
    const plano = typeof req.body?.plano === 'string' && req.body.plano.trim() ? req.body.plano.trim() : `+${vagasTotal}`;
    const assinatura = await model.criarAssinatura({
        responsavelId: req.user?.id ?? null,
        plano,
        vagasTotal,
        ciclo,
        providerRef: null,
    });
    return res.status(201).json(assinatura);
}

/** DELETE /assinaturas/:id — cancela um pacote (reduz o pool). Só admin. */
export async function cancelarAssinaturaController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const atual = await model.buscarAssinatura(id);
    if (!atual) {
        return res.status(404).json({ message: 'Assinatura não encontrada!' });
    }
    // Cancelar reduz o pool; não deixa o pool ficar menor que o já alocado.
    if (atual.status === 'ativa') {
        const [comprado, alocado] = await Promise.all([
            model.totalVagasCompradas(),
            model.totalVagasAlocadas(),
        ]);
        if (comprado - atual.vagas_total < alocado) {
            return res.status(409).json({
                message: 'Redistribua as vagas antes de cancelar: o pacote ainda está em uso pelos ministérios.',
            });
        }
    }
    await model.cancelarAssinatura(id);
    return res.status(200).json({ message: 'Assinatura cancelada!' });
}

/**
 * PUT /ministerios/:id/vagas — define as vagas extras alocadas ao ministério,
 * limitado ao pool disponível (comprado − alocado nos outros). Só admin.
 */
export async function distribuirVagasController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const vagasExtras = Number(req.body?.vagasExtras);
    if (!Number.isInteger(vagasExtras) || vagasExtras < 0) {
        return res.status(400).json({ message: 'vagasExtras deve ser um inteiro ≥ 0!' });
    }
    const ministerio = await ministerioModel.buscarMinisterio(ministerioId);
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    const [comprado, alocado] = await Promise.all([
        model.totalVagasCompradas(),
        model.totalVagasAlocadas(),
    ]);
    // Alocado pelos OUTROS ministérios + o novo valor não pode passar do comprado.
    const alocadoOutros = alocado - ministerio.vagas_extras;
    if (alocadoOutros + vagasExtras > comprado) {
        return res.status(409).json({
            message: `Sem vagas suficientes no pacote. Disponível: ${comprado - alocadoOutros}.`,
        });
    }
    const atualizado = await ministerioModel.alterarVagasExtras(ministerioId, vagasExtras);
    return res.status(200).json(atualizado);
}
