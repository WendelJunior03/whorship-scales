import { Request, Response } from 'express';
import { createEscalaVocal } from '../models/escalaVocalModel';
import { sugerirVocais } from '../models/escalaVocalModel';

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