import { Request, Response } from 'express';
import { createEscalaVocal, sugerirVocais, findEscalaVocalById, updateStatusEscalaVocal } from '../models/escalaVocalModel';

export async function createEscalaVocalController(req: Request, res: Response) {
    try {
        const { membroId, cultoId } = req.body;

    if (!membroId || !cultoId) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }

    await createEscalaVocal(membroId, cultoId);
    return res.status(201).json({ message: 'Escala vocal cadastrada com sucesso!' })
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function sugerirVocaisController(req: Request, res: Response) {
    try {
    const vocais = await sugerirVocais(2)
    return res.status(200).json({message: 'Sugestão de vocais encontrada com sucesso!', vocais})
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function confirmarPresencaController (req: Request, res: Response) {
    const { id } = req.params
    const { status } = req.body

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!'})
    }


    if (!id || !status) {
        return res.status(400).json({ message: 'Dados inválidos!'})
    }

    const escalaVocal = await findEscalaVocalById(Number(id))

    if (!escalaVocal) {
        return res.status(404).json({ message: 'Escala vocal não encontrada!'})
    }

    if (req.user.id !== escalaVocal.membro_id) {
        return res.status(403 ).json({ message: 'Não autorizado!'})
    }

    await updateStatusEscalaVocal(Number(id), status);
    return res.status(200).json({message: 'Escala vocal atualizada com sucesso!'})
}