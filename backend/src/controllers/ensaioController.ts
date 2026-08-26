import { Request, Response } from 'express';
import {
    createEnsaio,
    findEnsaioByCultoId,
    findEnsaioById,
    updateEnsaio,
    deleteEnsaio,
    createEnsaioParticipante,
    findParticipantesByEnsaioId,
    findEnsaioParticipanteById,
    updateStatusEnsaioParticipante,
    deleteEnsaioParticipante,
    findMinhasParticipacoesEnsaio,
} from '../models/ensaioModel';
import { findCultoById } from '../models/cultoModel';
import { findById, findAdminsAtivos } from '../models/membroModel';
import { createNotificacao } from '../models/notificacaoModel';
import { formatarDataHoraCurta } from '../utils/data';

export async function createEnsaioController(req: Request, res: Response) {
    try {
        const { cultoId, dataHora, observacoes } = req.body;

        if (!cultoId || !dataHora) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        const culto = await findCultoById(cultoId);
        if (!culto) {
            return res.status(404).json({ message: 'Culto não encontrado!' })
        }

        const jaExiste = await findEnsaioByCultoId(cultoId);
        if (jaExiste) {
            return res.status(400).json({ message: 'Este culto já tem um ensaio marcado!' })
        }

        const ensaio = await createEnsaio(cultoId, dataHora, observacoes ?? null);
        return res.status(201).json(ensaio)
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!' })
    }
}

export async function getEnsaioDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;

    const ensaio = await findEnsaioByCultoId(Number(cultoId));
    if (!ensaio) {
        return res.status(200).json({ ensaio: null, participantes: [] })
    }

    const participantes = await findParticipantesByEnsaioId(ensaio.id);
    return res.status(200).json({ ensaio, participantes })
}

export async function updateEnsaioController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { dataHora, observacoes } = req.body;

        if (!dataHora) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        const ensaio = await findEnsaioById(Number(id));
        if (!ensaio) {
            return res.status(404).json({ message: 'Ensaio não encontrado!' })
        }

        const atualizado = await updateEnsaio(Number(id), dataHora, observacoes ?? null);
        return res.status(200).json(atualizado)
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!' })
    }
}

export async function deleteEnsaioController(req: Request, res: Response) {
    const { id } = req.params;

    const ensaio = await findEnsaioById(Number(id));
    if (!ensaio) {
        return res.status(404).json({ message: 'Ensaio não encontrado!' })
    }

    await deleteEnsaio(Number(id));
    return res.status(200).json({ message: 'Ensaio removido com sucesso!' })
}

export async function addParticipanteController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { membroId } = req.body;

        if (!membroId) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        const ensaio = await findEnsaioById(Number(id));
        if (!ensaio) {
            return res.status(404).json({ message: 'Ensaio não encontrado!' })
        }

        const participante = await createEnsaioParticipante(Number(id), membroId);

        const membro = await findById(membroId);
        if (membro) {
            try {
                await createNotificacao(
                    membroId,
                    'ensaio',
                    'Você foi convidado para um ensaio',
                    `Ensaio marcado para o dia ${formatarDataHoraCurta(ensaio.data_hora)}. Confirme sua presença.`,
                    ensaio.culto_id,
                    'ensaio_participante',
                    participante.id
                );
            } catch (error) {
                console.error('Erro ao criar notificação:', error);
            }
        }

        return res.status(201).json(participante)
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!' })
    }
}

export async function removeParticipanteController(req: Request, res: Response) {
    const { id } = req.params;

    const participante = await findEnsaioParticipanteById(Number(id));
    if (!participante) {
        return res.status(404).json({ message: 'Participante não encontrado!' })
    }

    await deleteEnsaioParticipante(Number(id));
    return res.status(200).json({ message: 'Participante removido do ensaio!' })
}

export async function confirmarPresencaEnsaioController(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }

    if (!id || !status) {
        return res.status(400).json({ message: 'Dados inválidos!' })
    }

    const participante = await findEnsaioParticipanteById(Number(id));
    if (!participante) {
        return res.status(404).json({ message: 'Participante não encontrado!' })
    }

    if (req.user.id !== participante.membro_id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }

    await updateStatusEnsaioParticipante(Number(id), status);

    if (status === 'recusado') {
        try {
            const membro = await findById(req.user.id);
            const ensaio = await findEnsaioById(participante.ensaio_id);
            const nomeMembro = membro?.nome ?? 'Um membro';
            const dataEnsaio = ensaio ? ` do ensaio do dia ${formatarDataHoraCurta(ensaio.data_hora)}` : '';

            const admins = await findAdminsAtivos();
            for (const admin of admins) {
                await createNotificacao(admin.id, 'ensaio', 'Recusa de ensaio', `${nomeMembro} recusou presença${dataEnsaio}.`);
            }
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }

    return res.status(200).json({ message: 'Presença atualizada com sucesso!' })
}

export async function getMinhasParticipacoesEnsaioController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!' })
    }
    const participacoes = await findMinhasParticipacoesEnsaio(req.user.id);
    return res.status(200).json(participacoes)
}

export async function registrarFaltaEnsaioController(req: Request, res: Response) {
    const { id } = req.params;

    const participante = await findEnsaioParticipanteById(Number(id));
    if (!participante) {
        return res.status(404).json({ message: 'Participante não encontrado!' })
    }

    await updateStatusEnsaioParticipante(Number(id), 'falta');

    try {
        const ensaio = await findEnsaioById(participante.ensaio_id);
        const dataEnsaio = ensaio ? ` do ensaio do dia ${formatarDataHoraCurta(ensaio.data_hora)}` : '';
        await createNotificacao(
            participante.membro_id,
            'falta',
            'Falta registrada',
            `O líder registrou sua falta${dataEnsaio}.`
        );
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
    }

    return res.status(200).json({ message: 'Falta registrada com sucesso!' })
}
