import { Request, Response, NextFunction } from 'express';

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