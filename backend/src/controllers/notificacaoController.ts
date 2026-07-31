import { Request, Response } from 'express';
import { findMinhasNotificacoes, findNotificacaoById, marcarComoLida } from '../models/notificacaoModel';

export async function getMinhasNotificacoesController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }
    const notificacoes = await findMinhasNotificacoes(req.user.id);
    return res.status(200).json(notificacoes);
}

export async function marcarComoLidaController(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }

    const notificacao = await findNotificacaoById(Number(id));
    if (!notificacao) {
        return res.status(404).json({ message: 'Notificação não encontrada!' })
    }

    if (notificacao.membro_id !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }

    await marcarComoLida(Number(id));
    return res.status(200).json({ message: 'Notificação marcada como lida!' })
}
