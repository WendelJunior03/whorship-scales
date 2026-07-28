import { Request, Response } from 'express';
import { createRepertorio, findAllRepertorios } from '../models/repertorioModel';
import { findProximoCultoDoMembro } from '../models/escalaVocalModel';

export async function createRepertorioController(req: Request, res: Response) {
    try {
        const { cultoId, nome, tom, linkMusica} = req.body

        if (!cultoId || !nome || !tom || !linkMusica) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        await createRepertorio(cultoId, nome, tom, linkMusica);
        return res.status(201).json({ message: 'Repertório cadastrado com sucesso!' })
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function meuProximoCultoController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!'})
    }

    const culto = await findProximoCultoDoMembro(req.user.id)

    if (!culto) {
        return res.status(404).json({ message: 'Culto não encontrada!'})
    }

    const repertorios = await findAllRepertorios(culto.id)

    if (repertorios.length === 0) {
        return res.status(200).json({ message: 'Nenhum repertório cadastrado para este culto!', culto, repertorios: []})
    }

    return res.status(200).json({ message: 'Repertório encontrado com sucesso!', culto, repertorios})
}