import { Request, Response, NextFunction } from 'express';
import { podeAcessar } from '../config/capacidades';

/**
 * @deprecated Autorização por LISTA DE PAPÉIS (RBAC acoplado). Mantido só durante a
 * migração — use `autoriza('capacidade')` (spec 02, D-02.2).
 */
export function autorizator(permittedRoles: string[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!req.user) {
            throw new Error('req.user não configurado!')
        }
        if (!permittedRoles.includes(req.user.papel)) {
            return res.status(403).json({message: 'Sem permissão!'})
        }

        next()
    }
}

/**
 * Autorização por CAPACIDADE (spec 02, D-02.2). Consulta o mapa central
 * capacidade→quem-pode (`config/capacidades.ts`) usando os dois eixos de papel
 * do JWT — mudar quem pode fazer o quê acontece em um só lugar, não em N rotas.
 *
 * Só cobre capacidades de escopo organizacional/ministério (as que geram 403 por
 * papel). Capacidades de escopo "próprio" (dono do recurso) continuam validadas
 * no controller via `mesmoUsuario`, já que dependem do id do recurso.
 */
export function autoriza(capacidade: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!req.user) {
            throw new Error('req.user não configurado!')
        }

        const papelOrg = req.user.papel_org;
        // Token antigo (pré-RBAC) não tem papel_org → nega e força novo login.
        if (!papelOrg) {
            return res.status(403).json({ message: 'Sessão desatualizada. Faça login novamente.' })
        }

        const usuario = {
            papelOrg,
            papelMinisterio: req.user.papel_ministerio ?? null,
        };

        if (!podeAcessar(usuario, capacidade)) {
            return res.status(403).json({ message: 'Sem permissão!' })
        }

        next()
    }
}
