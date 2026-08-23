import { Request, Response } from 'express';
import { createExcecao } from '../models/excecoesModel';
import { findEscalaFixaById } from '../models/escalaFixaModel';
import { enviarEmail } from '../services/emailService';
import { findAdminsAtivos, findById, findMembrosAtivosExcluindo } from '../models/membroModel';
import { createNotificacao } from '../models/notificacaoModel';
import { podeAcessar, mesmoUsuario } from '../config/capacidades';

export async function candidatosExcecaoController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }

    const candidatos = await findMembrosAtivosExcluindo(req.user.id)
    return res.status(200).json(candidatos)
}

export async function createExcecoesController(req: Request, res: Response) {
    const { escalaFixaId, substitutoId, indicadoId, data } = req.body;

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
    
    const dono = await findById(escalaFixa.membro_id);
    const nomeDono = dono?.nome ?? 'Um membro';
    // `indicadoId` (indicação no ato da recusa) já convida de verdade — vira substituto
    // igual o admin escolhendo manualmente, pra pessoa não depender do admin agir primeiro.
    const foiIndicacao = !substitutoId && !!indicadoId;
    const substitutoFinalId = substitutoId ?? indicadoId;
    await createExcecao(escalaFixaId, data, substitutoFinalId);

    const substituto = substitutoFinalId ? await findById(substitutoFinalId) : null;

    if (substituto) {
        try {
            await enviarEmail(
                substituto.email,
                'Você foi escalado para um culto!',
                foiIndicacao
                    ? `Olá ${substituto.nome}, ${nomeDono} indicou você para o culto do dia ${data}.`
                    : `Olá ${substituto.nome}, você foi escalado para um culto no dia ${data}.`
            );
        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
        try {
            await createNotificacao(
                substituto.id,
                'substituicao',
                foiIndicacao ? 'Você foi indicado' : 'Substituição registrada',
                foiIndicacao
                    ? `${nomeDono} recusou a escala de "${escalaFixa.funcao}" (${escalaFixa.dia_semana}) do dia ${data} e indicou você. Confirme sua presença.`
                    : `Você foi escalado como substituto para o culto do dia ${data}.`
            );
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }

    // Admins ficam sabendo da recusa — com ou sem indicação, a vaga preenchida ou não.
    try {
        const mensagem = substituto
            ? `${nomeDono} recusou a escala de "${escalaFixa.funcao}" (${escalaFixa.dia_semana}) do dia ${data} e indicou ${substituto.nome} para a escala.`
            : `${nomeDono} recusou a escala de "${escalaFixa.funcao}" (${escalaFixa.dia_semana}) do dia ${data}. Precisa definir um substituto.`;

        const admins = await findAdminsAtivos();
        for (const admin of admins) {
            // O substituto/indicado já recebeu o aviso pessoal acima — evita duplicar.
            if (substituto && admin.id === substituto.id) continue;
            await createNotificacao(admin.id, 'substituicao', 'Falta registrada', mensagem);
        }
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
    }

    return res.status(201).json({ message: 'Exceção cadastrada com sucesso!' })
}