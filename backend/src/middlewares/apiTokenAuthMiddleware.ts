import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../config/database';
import { hashApiToken } from '../utils/apiToken';
import * as apiTokenModel from '../models/apiTokenModel';

/**
 * Autenticação da API externa por Token (read-only). O cliente manda
 * `Authorization: Bearer <token>`; comparamos o hash com os guardados. Ao validar,
 * estabelece o contexto de tenant (mesma mecânica do authMiddleware) — daí pra
 * frente as queries já saem escopadas por org via RLS.
 */
export async function apiTokenAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.header('Authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1]) {
        return res.status(401).json({ message: 'Token de API ausente. Use Authorization: Bearer <token>.' });
    }

    const registro = await apiTokenModel.buscarPorHash(hashApiToken(match[1]));
    if (!registro) {
        return res.status(401).json({ message: 'Token de API inválido.' });
    }

    req.orgId = registro.org_id;
    // Registra o uso sem bloquear a resposta.
    apiTokenModel.marcarUso(registro.id).catch(() => {});

    tenantStorage.run({ orgId: registro.org_id }, () => next());
}

/**
 * Barreira read-only: a API por token só aceita métodos de leitura. Defesa em
 * profundidade — mesmo que uma rota de escrita seja montada por engano aqui, cai fora.
 */
export function somenteLeitura(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ message: 'A API por token é somente leitura.' });
    }
    next();
}
