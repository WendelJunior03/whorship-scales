import { Request, Response } from 'express';
import { createExcecao } from '../models/excecoesModel';
import { findEscalaFixaById } from '../models/escalaFixaModel';

export async function createExcecoesController(req: Request, res: Response) {
    const { escalaFixaId, substitutoId, data } = req.body;

    if (!escalaFixaId || !data) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }
    
    if (!req.user) {
        throw new Error('req.user não configurado!')
    }
       
    const escalaFixa = await findEscalaFixaById(escalaFixaId);
    if (!escalaFixa) {
        return res.status(404).json({ message: 'Escala fixa não encontrada!' })
    }

    if (req.user.papel !== 'admin' && req.user.id !== escalaFixa.membro_id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }
    
    await createExcecao(escalaFixaId, data, substitutoId);
    return res.status(201).json({ message: 'Exceção cadastrada com sucesso!' })
}