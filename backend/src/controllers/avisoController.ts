import { Request, Response } from 'express';
import {
    listarAvisos,
    contarNaoLidos,
    findAvisoById,
    findAvisoCru,
    criarAviso,
    atualizarAviso,
    deletarAviso,
    marcarLido,
} from '../models/avisoModel';

/** GET /avisos — mural da org (com flag de lido do solicitante). */
export async function listarAvisosController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    return res.status(200).json(await listarAvisos(req.user.id));
}

/** GET /avisos/nao-lidos — contagem de não lidos (badge). */
export async function contarNaoLidosController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    return res.status(200).json({ total: await contarNaoLidos(req.user.id) });
}

/** GET /avisos/:id — detalhe (marca como lido de passagem). */
export async function detalheAvisoController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'id inválido!' });
    }
    const aviso = await findAvisoById(id, req.user.id);
    if (!aviso) return res.status(404).json({ message: 'Aviso não encontrado!' });
    await marcarLido(id, req.user.id);
    return res.status(200).json(aviso);
}

/** POST /avisos — publica (capacidade aviso.publicar). */
export async function criarAvisoController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
    const corpo = typeof req.body?.corpo === 'string' && req.body.corpo.trim() ? req.body.corpo.trim() : null;
    const ministerioId = Number.isInteger(req.body?.ministerioId) ? req.body.ministerioId : null;
    if (!titulo) {
        return res.status(400).json({ message: 'Título é obrigatório!' });
    }
    const aviso = await criarAviso({ titulo, corpo, ministerioId, autorId: req.user.id });
    return res.status(201).json(aviso);
}

/** PUT /avisos/:id — edita (capacidade aviso.publicar). */
export async function atualizarAvisoController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const atual = await findAvisoCru(id);
    if (!atual) return res.status(404).json({ message: 'Aviso não encontrado!' });
    const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
    const corpo = typeof req.body?.corpo === 'string' && req.body.corpo.trim() ? req.body.corpo.trim() : null;
    const ministerioId = Number.isInteger(req.body?.ministerioId) ? req.body.ministerioId : null;
    if (!titulo) {
        return res.status(400).json({ message: 'Título é obrigatório!' });
    }
    return res.status(200).json(await atualizarAviso(id, { titulo, corpo, ministerioId }));
}

/** DELETE /avisos/:id — remove (capacidade aviso.publicar). */
export async function deletarAvisoController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const atual = await findAvisoCru(id);
    if (!atual) return res.status(404).json({ message: 'Aviso não encontrado!' });
    await deletarAviso(id);
    return res.status(200).json({ message: 'Aviso removido!' });
}

/** POST /avisos/:id/lido — marca como lido (qualquer membro). */
export async function marcarLidoController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const id = Number(req.params.id);
    const atual = await findAvisoCru(id);
    if (!atual) return res.status(404).json({ message: 'Aviso não encontrado!' });
    await marcarLido(id, req.user.id);
    return res.status(200).json({ message: 'Marcado como lido!' });
}
