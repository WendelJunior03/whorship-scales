import { Request, Response } from 'express';
import * as model from '../models/pastaModel';
import { buscarMusica } from '../models/musicaModel';

export async function listarPastasController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarPastas());
}

export async function criarPastaController(req: Request, res: Response) {
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    const ministerioId = Number.isInteger(req.body?.ministerioId) ? req.body.ministerioId : null;
    if (!nome) {
        return res.status(400).json({ message: 'Nome da pasta é obrigatório!' });
    }
    return res.status(201).json(await model.criarPasta(nome, ministerioId));
}

export async function renomearPastaController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    if (!nome) {
        return res.status(400).json({ message: 'Nome da pasta é obrigatório!' });
    }
    const pasta = await model.renomearPasta(id, nome);
    if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada!' });
    }
    return res.status(200).json(pasta);
}

export async function apagarPastaController(req: Request, res: Response) {
    const pasta = await model.apagarPasta(Number(req.params.id));
    if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada!' });
    }
    return res.status(200).json({ message: 'Pasta removida!' });
}

export async function listarMusicasDaPastaController(req: Request, res: Response) {
    const pasta = await model.buscarPasta(Number(req.params.id));
    if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada!' });
    }
    return res.status(200).json(await model.listarMusicasDaPasta(pasta.id));
}

export async function adicionarMusicaController(req: Request, res: Response) {
    const pastaId = Number(req.params.id);
    const musicaId = Number(req.body?.musicaId);
    const pasta = await model.buscarPasta(pastaId);
    if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada!' });
    }
    if (!Number.isInteger(musicaId) || !(await buscarMusica(musicaId))) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    await model.adicionarMusica(pastaId, musicaId);
    return res.status(200).json(await model.listarMusicasDaPasta(pastaId));
}

export async function removerMusicaController(req: Request, res: Response) {
    const pastaId = Number(req.params.id);
    const musicaId = Number(req.params.musicaId);
    const pasta = await model.buscarPasta(pastaId);
    if (!pasta) {
        return res.status(404).json({ message: 'Pasta não encontrada!' });
    }
    await model.removerMusica(pastaId, musicaId);
    return res.status(200).json({ message: 'Música removida da pasta!' });
}
