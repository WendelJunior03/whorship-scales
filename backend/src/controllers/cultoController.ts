import { Request, Response } from 'express';
import { findCultoById, createCulto, findAllCultos, deleteCulto, findResumoCultos } from '../models/cultoModel';

export async function getAllCultosController(req: Request, res: Response) {
    const cultos = await findAllCultos();
    return res.status(200).json(cultos);
}

export async function getResumoCultosController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' });
    }
    const cultos = await findResumoCultos(req.user.id);
    return res.status(200).json(cultos);
}

export async function getCultoByIdController(req: Request, res: Response) {
    const { id } = req.params;

    const culto = await findCultoById(Number(id));

    if (!culto) {
        return res.status(404).json({ message: 'Culto não encontrado!' });
    }

    return res.status(200).json(culto);
}

export async function createCultoController(req: Request, res: Response) {
    try {
        const { dataHora, tipo } = req.body;

        if (!dataHora) {
            return res.status(400).json({ message: 'Data é obrigatória!' })
        }

        const culto = await createCulto(dataHora, tipo ?? null);
        return res.status(201).json(culto);
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!' })
    }
}

export async function deleteCultoController(req: Request, res: Response) {
    const { id } = req.params;

    const culto = await findCultoById(Number(id));
    if (!culto) {
        return res.status(404).json({ message: 'Culto não encontrado!' })
    }

    await deleteCulto(Number(id));
    return res.status(200).json({ message: 'Culto removido com sucesso!' })
}