import { Request, Response } from 'express';
import * as model from '../models/apiTokenModel';
import { gerarApiToken } from '../utils/apiToken';

/** GET /api-tokens — lista os tokens da org (sem o valor, só metadados). */
export async function listarTokensController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarTokens());
}

/**
 * POST /api-tokens — cria um token de leitura. Devolve o valor EM CLARO UMA ÚNICA VEZ
 * (guardamos só o hash). O cliente deve copiá-lo agora; não dá pra recuperar depois.
 */
export async function criarTokenController(req: Request, res: Response) {
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    if (!nome) {
        return res.status(400).json({ message: 'Dê um nome ao token (ex.: "Integração X").' });
    }
    const { token, hash, prefixo } = gerarApiToken();
    const criado = await model.criarToken({
        nome,
        hash,
        prefixo,
        ministerioId: null, // v1: token com escopo da organização (leitura)
        criadoPor: req.user?.id ?? null,
    });
    // `token` só aparece aqui.
    return res.status(201).json({ ...criado, token });
}

/** DELETE /api-tokens/:id — revoga (apaga) um token. */
export async function revogarTokenController(req: Request, res: Response) {
    const ok = await model.revogarToken(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: 'Token não encontrado.' });
    return res.status(200).json({ message: 'Token revogado.' });
}
