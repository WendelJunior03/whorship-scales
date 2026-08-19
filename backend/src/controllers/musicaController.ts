import { Request, Response } from 'express';
import * as model from '../models/musicaModel';

function validarBpm(bpm: unknown): { ok: true; valor: number | null } | { ok: false } {
    if (bpm === undefined || bpm === null || bpm === '') {
        return { ok: true, valor: null };
    }
    const n = Number(bpm);
    if (Number.isNaN(n) || n < 20 || n > 400) {
        return { ok: false };
    }
    return { ok: true, valor: Math.round(n) };
}

export async function criarMusicaController(req: Request, res: Response) {
    const { nome, tomPadrao, bpm } = req.body;
    if (!nome || !String(nome).trim()) {
        return res.status(400).json({ message: 'Nome da música é obrigatório!' });
    }
    const b = validarBpm(bpm);
    if (!b.ok) {
        return res.status(400).json({ message: 'BPM inválido (entre 20 e 400).' });
    }
    const musica = await model.criarMusica(String(nome).trim(), tomPadrao ?? null, b.valor);
    return res.status(201).json(musica);
}

export async function listarMusicasController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarMusicas());
}

export async function getMusicaController(req: Request, res: Response) {
    const musica = await model.buscarMusica(Number(req.params.id));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json(musica);
}

export async function atualizarMusicaController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { nome, tomPadrao, bpm } = req.body;
    if (!nome || !String(nome).trim()) {
        return res.status(400).json({ message: 'Nome da música é obrigatório!' });
    }
    const b = validarBpm(bpm);
    if (!b.ok) {
        return res.status(400).json({ message: 'BPM inválido (entre 20 e 400).' });
    }
    const musica = await model.atualizarMusica(id, String(nome).trim(), tomPadrao ?? null, b.valor);
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json(musica);
}

export async function apagarMusicaController(req: Request, res: Response) {
    const musica = await model.apagarMusica(Number(req.params.id));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json({ message: 'Música removida com sucesso!' });
}
