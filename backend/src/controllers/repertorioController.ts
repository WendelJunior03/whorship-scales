import { Request, Response } from 'express';
import { createRepertorio, findAllRepertorios, findRepertorioById, deleteRepertorio } from '../models/repertorioModel';
import { findProximoCultoDoMembro } from '../models/escalaVocalModel';
import { findProximoCultoAvulsaDoMembro } from '../models/escalaAvulsaModel';
import { findProximoCultoFixaDoMembro } from '../models/escalaFixaModel';

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

    const [cultoVocal, cultoAvulsa, cultoFixa] = await Promise.all([
        findProximoCultoDoMembro(req.user.id),
        findProximoCultoAvulsaDoMembro(req.user.id),
        findProximoCultoFixaDoMembro(req.user.id),
    ]);

    const candidatos = [cultoVocal, cultoAvulsa, cultoFixa].filter(Boolean);

    if (candidatos.length === 0) {
        return res.status(404).json({ message: 'Culto não encontrada!'})
    }

    const culto = candidatos.reduce((maisProximo, atual) =>
        new Date(atual.data_hora) < new Date(maisProximo.data_hora) ? atual : maisProximo
    );

    const repertorios = await findAllRepertorios(culto.id)

    if (repertorios.length === 0) {
        return res.status(200).json({ message: 'Nenhum repertório cadastrado para este culto!', culto, repertorios: []})
    }

    return res.status(200).json({ message: 'Repertório encontrado com sucesso!', culto, repertorios})
}

export async function getRepertorioDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;

    const repertorios = await findAllRepertorios(Number(cultoId));

    return res.status(200).json(repertorios);
}

export async function deleteRepertorioController(req: Request, res: Response) {
    const { id } = req.params;

    const repertorio = await findRepertorioById(Number(id));
    if (!repertorio) {
        return res.status(404).json({ message: 'Música não encontrada!' })
    }

    await deleteRepertorio(Number(id));
    return res.status(200).json({ message: 'Música removida com sucesso!' })
}