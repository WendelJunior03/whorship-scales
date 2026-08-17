import { Request, Response } from 'express';
import { createExcecao } from '../models/excecoesModel';
import { findEscalaFixaById } from '../models/escalaFixaModel';
import { enviarEmail } from '../services/emailService';
import { findById } from '../models/membroModel';
import { createNotificacao } from '../models/notificacaoModel';
import { podeAcessar, mesmoUsuario } from '../config/capacidades';

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

    // Admin (via capacidade) ou o dono da escala fixa (via ownership).
    const usuario = { papelOrg: req.user.papel_org, papelMinisterio: req.user.papel_ministerio ?? null };
    if (!podeAcessar(usuario, 'excecao.criar') && !mesmoUsuario(escalaFixa.membro_id, req.user.id)) {
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