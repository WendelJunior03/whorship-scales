import { Request, Response } from 'express';
import {
    listarRoteiro,
    criarRoteiroItem,
    atualizarRoteiroItem,
    deletarRoteiroItem,
    reordenarRoteiro,
    findRoteiroItemById,
} from '../models/roteiroModel';
import { findCultoById } from '../models/cultoModel';

export async function listarRoteiroController(req: Request, res: Response) {
    const cultoId = Number(req.params.cultoId);
    if (!Number.isInteger(cultoId) || cultoId <= 0) {
        return res.status(400).json({ message: 'cultoId inválido!' });
    }
    return res.status(200).json(await listarRoteiro(cultoId));
}

export async function criarRoteiroItemController(req: Request, res: Response) {
    const cultoId = Number(req.body?.cultoId);
    const tipo = req.body?.tipo === 'momento' ? 'momento' : 'musica';
    const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
    const tom = typeof req.body?.tom === 'string' && req.body.tom.trim() ? req.body.tom.trim() : null;
    const duracaoSeg = Number.isInteger(req.body?.duracaoSeg) ? req.body.duracaoSeg : null;
    const musicaId = Number.isInteger(req.body?.musicaId) ? req.body.musicaId : null;
    const linkMusica = typeof req.body?.linkMusica === 'string' && req.body.linkMusica.trim() ? req.body.linkMusica.trim() : null;

    if (!Number.isInteger(cultoId) || cultoId <= 0 || !titulo) {
        return res.status(400).json({ message: 'cultoId e título são obrigatórios!' });
    }
    const culto = await findCultoById(cultoId);
    if (!culto) {
        return res.status(404).json({ message: 'Culto não encontrado!' });
    }

    const item = await criarRoteiroItem({ cultoId, tipo, titulo, tom, duracaoSeg, musicaId, linkMusica });
    return res.status(201).json(item);
}

export async function atualizarRoteiroItemController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await findRoteiroItemById(id);
    if (!item) {
        return res.status(404).json({ message: 'Item do roteiro não encontrado!' });
    }
    const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : item.titulo;
    const tom = typeof req.body?.tom === 'string' ? (req.body.tom.trim() || null) : item.tom;
    const duracaoSeg = req.body?.duracaoSeg === null || Number.isInteger(req.body?.duracaoSeg)
        ? req.body.duracaoSeg
        : item.duracao_seg;

    const atualizado = await atualizarRoteiroItem(id, { titulo, tom, duracaoSeg });
    return res.status(200).json(atualizado);
}

export async function deletarRoteiroItemController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await findRoteiroItemById(id);
    if (!item) {
        return res.status(404).json({ message: 'Item do roteiro não encontrado!' });
    }
    await deletarRoteiroItem(id);
    return res.status(200).json({ message: 'Item removido!' });
}

export async function reordenarRoteiroController(req: Request, res: Response) {
    const cultoId = Number(req.params.cultoId);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((n: unknown) => Number.isInteger(n)) : null;
    if (!Number.isInteger(cultoId) || !ids || ids.length === 0) {
        return res.status(400).json({ message: 'cultoId e ids (ordem) são obrigatórios!' });
    }
    await reordenarRoteiro(cultoId, ids);
    return res.status(200).json(await listarRoteiro(cultoId));
}
