import { Request, Response } from 'express';
import * as model from '../models/integracaoMinisterioModel';
import { temChaveCripto } from '../utils/cripto';

/** GET /ministerios/:id/holyrics — config atual (token mascarado). */
export async function getHolyricsController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const config = await model.buscarHolyrics(ministerioId);
    return res.status(200).json(config); // null = ainda não configurado
}

/** PUT /ministerios/:id/holyrics — salva host/porta/token (token cifrado). */
export async function salvarHolyricsController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const host = typeof req.body?.host === 'string' ? req.body.host.trim() : '';
    const porta = Number(req.body?.porta);
    const token = typeof req.body?.token === 'string' && req.body.token.trim() ? req.body.token.trim() : undefined;
    const ativo = req.body?.ativo !== false;

    if (!host) {
        return res.status(400).json({ message: 'Informe o host do Holyrics.' });
    }
    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
        return res.status(400).json({ message: 'Porta inválida (1–65535).' });
    }
    // O token é segredo → só salva cifrado. Sem chave de cifra, não deixa gravar em claro.
    if (token && !temChaveCripto()) {
        return res.status(503).json({ message: 'Cifra indisponível (APP_ENC_KEY não configurada).' });
    }

    await model.salvarHolyrics(ministerioId, { host, porta, token, ativo });
    return res.status(200).json(await model.buscarHolyrics(ministerioId));
}

/** DELETE /ministerios/:id/holyrics — remove a integração. */
export async function removerHolyricsController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const ok = await model.removerHolyrics(ministerioId);
    if (!ok) return res.status(404).json({ message: 'Integração não encontrada.' });
    return res.status(200).json({ message: 'Integração removida.' });
}

/**
 * POST /ministerios/:id/holyrics/testar — tenta alcançar o Holyrics (best-effort).
 * O Holyrics roda na rede LOCAL da igreja, então do servidor isso normalmente falha —
 * o resultado é informativo, não um erro da aplicação (por isso 200 com `ok`).
 */
export async function testarHolyricsController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const conexao = await model.obterConexaoHolyrics(ministerioId);
    if (!conexao) {
        return res.status(400).json({ ok: false, message: 'Configure host, porta e token antes de testar.' });
    }
    const { host, porta, token } = conexao;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
        const url = `http://${host}:${porta}/api/GetCurrentSong?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url, { signal: controller.signal });
        return res.status(200).json({ ok: true, message: `Holyrics respondeu (HTTP ${resp.status}).` });
    } catch {
        return res.status(200).json({
            ok: false,
            message: 'Não foi possível alcançar o Holyrics. Ele roda na rede local da igreja e pode não ser acessível a partir do servidor.',
        });
    } finally {
        clearTimeout(timer);
    }
}
