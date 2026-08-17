import { Request, Response, NextFunction } from 'express';
import { podeUsar } from '../config/recursos';
import { buscarOrgPorId } from '../models/organizacaoModel';

/**
 * Gating de recurso por plano/flag (spec 03, D-03.3). Backend é a fonte da verdade —
 * o frontend só espelha (selo PRO / CTA de upgrade), nunca confia só nele.
 *
 * Lê o plano ATUAL da organização no banco (não do JWT) pra um downgrade valer na hora,
 * não só no próximo login. Como PRO é ortogonal ao RBAC (spec 02), combine com `autoriza`
 * quando a ação também exigir papel:  ...authMiddleware, autoriza('x'), requerRecurso('y')...
 *
 * ⚠️ v1: com LIBERAR_TUDO_V1 = true, isto NÃO bloqueia por plano (só por flag). É o ponto
 * de checagem já pronto pra "virar a chave" quando a cobrança entrar.
 */
export function requerRecurso(chave: string) {
    return async function (req: Request, res: Response, next: NextFunction) {
        if (!req.orgId) {
            return res.status(401).json({ message: 'Não autenticado!' });
        }

        const org = await buscarOrgPorId(req.orgId);
        if (!org) {
            return res.status(404).json({ message: 'Organização não encontrada!' });
        }

        if (!podeUsar({ plano: org.plano }, chave)) {
            return res.status(403).json({
                message: 'Recurso não disponível no seu plano.',
                recurso: chave,
                upgrade: true,
            });
        }

        next();
    };
}
