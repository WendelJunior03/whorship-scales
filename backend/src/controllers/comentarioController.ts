import { Request, Response } from 'express';
import {
    listarComentariosDoCulto,
    criarComentario,
    findParticipantesDoCulto,
} from '../models/comentarioModel';
import { findCultoById } from '../models/cultoModel';
import { findById } from '../models/membroModel';
import { createNotificacao } from '../models/notificacaoModel';
import { formatarDataHoraCurta } from '../utils/data';

// Mesmo mapeamento usado na escala fixa (getUTCDay -> dia da semana).
const diaSemanaPorIndice: Record<number, string> = { 0: 'domingo', 3: 'quarta', 6: 'sabado' };

export async function listarComentariosController(req: Request, res: Response) {
    const cultoId = Number(req.params.cultoId);
    if (!Number.isInteger(cultoId) || cultoId <= 0) {
        return res.status(400).json({ message: 'cultoId inválido!' });
    }
    const comentarios = await listarComentariosDoCulto(cultoId);
    return res.status(200).json(comentarios);
}

export async function criarComentarioController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' });
    }

    const cultoId = Number(req.body?.cultoId);
    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';

    if (!Number.isInteger(cultoId) || cultoId <= 0 || !texto) {
        return res.status(400).json({ message: 'cultoId e texto são obrigatórios!' });
    }

    const culto = await findCultoById(cultoId);
    if (!culto) {
        return res.status(404).json({ message: 'Culto não encontrado!' });
    }

    const comentario = await criarComentario(cultoId, req.user.id, texto);
    const autor = await findById(req.user.id);
    const autorNome = autor?.nome ?? 'Um membro';

    // Notifica os participantes do culto (menos o autor).
    try {
        const data = culto.data_hora.toISOString ? culto.data_hora.toISOString().slice(0, 10) : String(culto.data_hora).slice(0, 10);
        const diaSemana = diaSemanaPorIndice[new Date(data).getUTCDay()] ?? null;
        const participantes = await findParticipantesDoCulto(cultoId, data, diaSemana);
        const dataCulto = ` do culto do dia ${formatarDataHoraCurta(culto.data_hora)}`;
        for (const membroId of participantes) {
            if (membroId === req.user.id) continue;
            await createNotificacao(
                membroId,
                'comentario',
                'Novo comentário',
                `${autorNome} comentou na escala${dataCulto}.`,
                cultoId,
            );
        }
    } catch (error) {
        console.error('Erro ao notificar comentário:', error);
    }

    return res.status(201).json({ ...comentario, autor_nome: autorNome });
}
