import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../config/database';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
        return res.status(401).json({message: 'Token não encontrado!'})
    }

    const authToken = authHeader.split(' ')[1]

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET não configurado')
        }

        if (!authToken) {
            throw new Error('authToken não configurado')
        }

        const payload = jwt.verify(authToken, process.env.JWT_SECRET) as JwtPayload

        // Token de antes do multi-tenant (sem org) não pode acessar dados escopados.
        if (typeof payload.org_id !== 'number') {
            return res.status(401).json({ message: 'Token sem organização. Faça login novamente.' })
        }

        req.user = payload
        req.orgId = payload.org_id

        // Estabelece o contexto de tenant para TODA a cadeia async desta request
        // (controllers → models). É aqui que a org "entra" nas queries: o wrapper
        // `query()` lê este contexto e injeta `app.current_org` (ver database.ts).
        // Ponto único de injeção → impossível esquecer em uma rota.
        tenantStorage.run({ orgId: req.orgId }, () => next())
    } catch {
        return res.status(401).json({message: 'Token inválido!'})
    }
}
