import { Request, Response } from 'express';
import { createEscalaFixa, findEscalaEfetiva, findEscalaFixaMontada, findMyEscalaFixa } from '../models/escalaFixaModel';
import { findById } from '../models/membroModel';
import { enviarEmail } from '../services/emailService';

export async function createEscalaFixaController(req: Request, res: Response) {
    try {
        const {membroId, diaSemana, funcao} = req.body

    if (!membroId || !diaSemana || !funcao) {
        return res.status(400).json({message: 'Todos os campos são obrigatórios!'})
    }

    await createEscalaFixa(membroId, diaSemana, funcao);

    const membro = await findById(membroId)
    if (membro) {
        try {
            await enviarEmail(
                membro.email,
                'Você foi escalado na escala fixa!',
                `Olá ${membro.nome}, você foi cadastrado na escala fixa como "${funcao}" toda ${diaSemana}.`
            );
        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
    }

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

export async function getEscalaEfetivaController(req: Request, res: Response) {
    const data = req.query.data as string

    if (!data) {
        return res.status(400).json({ message: 'Data é obrigatória!'})
    }
    
    const escalaEfetiva = await findEscalaEfetiva(data)
    return res.status(200).json({message: 'Escala efetiva encontrada com sucesso!', escalaEfetiva})
}