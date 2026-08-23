import { Request, Response } from 'express';
import { createEscalaVocal, sugerirVocais, findEscalaVocalById, updateStatusEscalaVocal, findEscalaVocalByCultoId, findMinhaEscalaVocal, deleteEscalaVocal } from '../models/escalaVocalModel';
import { findById, findAdminsAtivos, findMembrosDisponiveisParaCulto } from '../models/membroModel';
import { findCultoById } from '../models/cultoModel';
import { createNotificacao } from '../models/notificacaoModel';
import { enviarEmail } from '../services/emailService';
import { formatarDataHoraCurta } from '../utils/data';

export async function createEscalaVocalController(req: Request, res: Response) {
    try {
        const { membroId, cultoId } = req.body;

    if (!membroId || !cultoId) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }

    const escalaCriada = await createEscalaVocal(membroId, cultoId);
    const membro = await findById(membroId)
    const culto = await findCultoById(cultoId)
    if (membro && culto) {
        try {
            await enviarEmail(
            membro.email,
            'Você foi escalado para um culto!',
            `Olá ${membro.nome}, você foi escalado para um culto no dia ${formatarDataHoraCurta(culto.data_hora)}.`
        );
        } catch (error) {
            console.error('Erro ao enviar email:', error);
        }
        try {
            await createNotificacao(
                membroId,
                'escala',
                'Nova escala publicada',
                `Você foi escalado para o culto do dia ${formatarDataHoraCurta(culto.data_hora)}.`,
                cultoId,
                'escala_vocal',
                escalaCriada.id
            );
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }
    return res.status(201).json({ message: 'Escala vocal cadastrada com sucesso!' })

    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function sugerirVocaisController(req: Request, res: Response) {
    try {
    const cultoId = Number(req.query.cultoId)
    if (!cultoId) {
        return res.status(400).json({ message: 'cultoId é obrigatório!' })
    }

    const vocais = await sugerirVocais(2, cultoId)
    return res.status(200).json({message: 'Sugestão de vocais encontrada com sucesso!', vocais})
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function candidatosVocaisController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }

    const cultoId = Number(req.query.cultoId)
    if (!cultoId) {
        return res.status(400).json({ message: 'cultoId é obrigatório!' })
    }

    const candidatos = await findMembrosDisponiveisParaCulto(cultoId, req.user.id, 'vocal')
    return res.status(200).json(candidatos)
}

export async function confirmarPresencaController (req: Request, res: Response) {
    const { id } = req.params
    const { status, indicadoId } = req.body

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!'})
    }


    if (!id || !status) {
        return res.status(400).json({ message: 'Dados inválidos!'})
    }

    const escalaVocal = await findEscalaVocalById(Number(id))

    if (!escalaVocal) {
        return res.status(404).json({ message: 'Escala vocal não encontrada!'})
    }

    if (req.user.id !== escalaVocal.membro_id) {
        return res.status(403 ).json({ message: 'Não autorizado!'})
    }

    await updateStatusEscalaVocal(Number(id), status);

    if (status === 'confirmado') {
        try {
            const membro = await findById(req.user.id);
            const admins = await findAdminsAtivos();
            for (const admin of admins) {
                await createNotificacao(
                    admin.id,
                    'confirmacao',
                    'Confirmação recebida',
                    `${membro?.nome ?? 'Um membro'} confirmou presença.`
                );
            }
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    } else if (status === 'recusado') {
        try {
            const membro = await findById(req.user.id);
            const culto = await findCultoById(escalaVocal.culto_id);
            const indicado = indicadoId ? await findById(Number(indicadoId)) : null;
            const nomeMembro = membro?.nome ?? 'Um membro';
            const dataCulto = culto ? ` do culto do dia ${formatarDataHoraCurta(culto.data_hora)}` : '';
            const mensagem = indicado
                ? `${nomeMembro} recusou a escala${dataCulto} e indicou ${indicado.nome} para a escala.`
                : `${nomeMembro} recusou a escala${dataCulto}.`;

            const admins = await findAdminsAtivos();
            for (const admin of admins) {
                // O indicado já recebe o aviso pessoal "Você foi indicado" abaixo — evita duplicar.
                if (indicado && admin.id === indicado.id) continue;
                await createNotificacao(admin.id, 'substituicao', 'Recusa de escala', mensagem, escalaVocal.culto_id);
            }

            if (indicado) {
                // Indicar já convida de verdade — cria a escala (pendente) igual o admin
                // faria manualmente, pra pessoa não depender do admin agir primeiro.
                const escalaCriada = await createEscalaVocal(indicado.id, escalaVocal.culto_id);
                try {
                    await enviarEmail(
                        indicado.email,
                        'Você foi escalado para um culto!',
                        `Olá ${indicado.nome}, ${nomeMembro} indicou você para o culto${dataCulto}.`
                    );
                } catch (error) {
                    console.error('Erro ao enviar email:', error);
                }
                await createNotificacao(
                    indicado.id,
                    'substituicao',
                    'Você foi indicado',
                    `${nomeMembro} recusou a escala de vocal${dataCulto} e indicou você. Confirme sua presença.`,
                    escalaVocal.culto_id,
                    'escala_vocal',
                    escalaCriada.id
                );
            }
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }

    return res.status(200).json({message: 'Escala vocal atualizada com sucesso!'})
}

export async function getEscalaVocalDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;

    const escalaVocal = await findEscalaVocalByCultoId(Number(cultoId));

    return res.status(200).json(escalaVocal);
}

export async function getMinhaEscalaVocalController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }
    const escalaVocal = await findMinhaEscalaVocal(req.user.id);
    return res.status(200).json(escalaVocal);
}

export async function deleteEscalaVocalController(req: Request, res: Response) {
    const { id } = req.params;

    const escalaVocal = await findEscalaVocalById(Number(id));
    if (!escalaVocal) {
        return res.status(404).json({ message: 'Escala vocal não encontrada!' })
    }

    await deleteEscalaVocal(Number(id));
    return res.status(200).json({ message: 'Escala vocal removida com sucesso!' })
}