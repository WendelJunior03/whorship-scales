import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

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
        
        req.user = jwt.verify(authToken, process.env.JWT_SECRET) as JwtPayload

        next();
    } catch {
        return res.status(401).json({message: 'Token inválido!'})
    }
}