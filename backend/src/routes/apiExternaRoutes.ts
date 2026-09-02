import { Router, Request, Response } from 'express';
import { apiTokenAuth, somenteLeitura } from '../middlewares/apiTokenAuthMiddleware';
import { listarMinisterios } from '../models/ministerioModel';
import { findAllMembers } from '../models/membroModel';
import { findAllCultos } from '../models/cultoModel';

/**
 * API externa (read-only) autenticada por Token de API. Todo request passa por
 * `apiTokenAuth` (valida o Bearer e escopa por org via RLS) + `somenteLeitura`.
 * Os dados saem já filtrados pela org dona do token.
 */
const router = Router();

router.use(apiTokenAuth, somenteLeitura);

// Envolve um handler async devolvendo erro JSON limpo (em vez do stack padrão).
const rota = (fn: (req: Request, res: Response) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
        try {
            await fn(req, res);
        } catch {
            res.status(500).json({ message: 'Erro ao consultar a API.' });
        }
    };

router.get('/', (_req, res) => {
    res.json({
        api: 'Worship Stage · API pública (somente leitura)',
        endpoints: ['/api/v1/ministerios', '/api/v1/membros', '/api/v1/escalas'],
    });
});

router.get('/ministerios', rota(async (_req, res) => {
    res.json(await listarMinisterios());
}));

router.get('/membros', rota(async (_req, res) => {
    res.json(await findAllMembers());
}));

router.get('/escalas', rota(async (_req, res) => {
    res.json(await findAllCultos());
}));

export default router;
