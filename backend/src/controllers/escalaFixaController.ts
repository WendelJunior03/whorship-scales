import { Request, Response } from 'express';
import { createEscalaFixa, findEscalaFixaMontada, findMyEscalaFixa } from '../models/escalaFixaModel';

export async function createEscalaFixaController(req: Request, res: Response) {
    try {
        const {membroId, diaSemana, funcao} = req.body

    if (!membroId || !diaSemana || !funcao) {
        return res.status(400).json({message: 'Todos os campos são obrigatórios!'})
    }

    await createEscalaFixa(membroId, diaSemana, funcao);

    return res.status(201).json({message: 'Escala fixa cadastrada com sucesso!'})
    } catch (error) {
        return res.status(500).json({message: 'Erro interno do servidor'})
    }
}

export async function getEscalaFixaMontadaController (req: Request, res: Response) {
    const escalaFixaMontada = await findEscalaFixaMontada()

    return res.status(200).json(escalaFixaMontada);
}

export async function getMyEscalaFixaController(req: Request, res: Response) {
    if (!req.user) {
            throw new Error('req.user não configurado!')
        }
    
        const { id } = req.user
        
        const membro = await findMyEscalaFixa(id)
    
        return res.status(200).json(membro)
}