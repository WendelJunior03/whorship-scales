import { Request, Response } from 'express';
import { createExcecao } from '../models/excecoesModel';
import { findEscalaFixaById } from '../models/escalaFixaModel';
import { enviarEmail } from '../services/emailService';
import { findById } from '../models/membroModel';
import { createNotificacao } from '../models/notificacaoModel';

export async function createExcecoesController(req: Request, res: Response) {
    const { escalaFixaId, substitutoId, data } = req.body;

    if (!escalaFixaId || !data) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }
    
    if (!req.user) {
        throw new Error('req.user não configurado!')
    }
       
    const escalaFixa = await findEscalaFixaById(escalaFixaId);
    if (!escalaFixa) {
        return res.status(404).json({ message: 'Escala fixa não encontrada!' })
    }

    if (req.user.papel !== 'admin' && req.user.id !== escalaFixa.membro_id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }
    
    await createExcecao(escalaFixaId, data, substitutoId);

    const substituto = await findById(substitutoId);
    if (substituto) {
        try {
            await enviarEmail(
            substituto.email,
            'Você foi escalado para um culto!',
            `Olá ${substituto.nome}, você foi escalado para um culto no dia ${data}.`
        );
        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
        try {
            await createNotificacao(
                substitutoId,
                'substituicao',
                'Substituição registrada',
                `Você foi escalado como substituto para o culto do dia ${data}.`
            );
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }
    return res.status(201).json({ message: 'Exceção cadastrada com sucesso!' })
}