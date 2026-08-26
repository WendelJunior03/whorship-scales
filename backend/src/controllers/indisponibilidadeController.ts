import { Request, Response } from 'express';
import {
    listarPorMembro,
    listarPorMinisterio,
    findById,
    criar,
    atualizar,
    deletar,
    Periodo,
    Recorrencia,
} from '../models/indisponibilidadeModel';
import { podeAcessar } from '../config/capacidades';

const PERIODOS: Periodo[] = ['dia_inteiro', 'matutino', 'vespertino', 'noturno'];
const RECORRENCIAS: Recorrencia[] = ['nenhuma', 'semanal', 'mensal'];
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Pode gerir indisponibilidade de qualquer membro (admin/ministro). */
function podeGerir(req: Request): boolean {
    const papelOrg = req.user?.papel_org;
    if (!papelOrg) return false;
    return podeAcessar({ papelOrg, papelMinisterio: req.user?.papel_ministerio ?? null }, 'escala.gerenciar');
}

/** Normaliza/valida o corpo de criação/edição. Retorna erro (string) ou os dados. */
function parseCorpo(body: unknown) {
    const b = (body ?? {}) as Record<string, unknown>;
    const periodo = PERIODOS.includes(b.periodo as Periodo) ? (b.periodo as Periodo) : 'dia_inteiro';
    const recorrencia = RECORRENCIAS.includes(b.recorrencia as Recorrencia)
        ? (b.recorrencia as Recorrencia)
        : 'nenhuma';
    const dataInicio = typeof b.dataInicio === 'string' ? b.dataInicio : '';
    const dataFim = typeof b.dataFim === 'string' && b.dataFim ? b.dataFim : dataInicio;
    const descricao =
        typeof b.descricao === 'string' && b.descricao.trim() ? b.descricao.trim().slice(0, 500) : null;
    const ministerioId = Number.isInteger(b.ministerioId) ? (b.ministerioId as number) : null;

    if (!DATA_RE.test(dataInicio) || !DATA_RE.test(dataFim)) {
        return { erro: 'dataInicio e dataFim devem ser YYYY-MM-DD!' as const };
    }
    if (dataFim < dataInicio) {
        return { erro: 'dataFim não pode ser antes de dataInicio!' as const };
    }
    return { periodo, recorrencia, dataInicio, dataFim, descricao, ministerioId };
}

/** GET /indisponibilidades/me — as minhas. */
export async function listarMinhasController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const rows = await listarPorMembro(req.user.id, true); // dono sempre vê a própria descrição
    return res.status(200).json(rows);
}

/** GET /indisponibilidades/membro/:membroId — de um membro (dono ou gestor). */
export async function listarPorMembroController(req: Request, res: Response) {
    const membroId = Number(req.params.membroId);
    if (!Number.isInteger(membroId) || membroId <= 0) {
        return res.status(400).json({ message: 'membroId inválido!' });
    }
    const ehDono = req.user?.id === membroId;
    const gestor = podeGerir(req);
    if (!ehDono && !gestor) {
        return res.status(403).json({ message: 'Sem permissão!' });
    }
    return res.status(200).json(await listarPorMembro(membroId, ehDono || gestor));
}

/** GET /indisponibilidades/ministerio/:ministerioId — visão de gestão. */
export async function listarPorMinisterioController(req: Request, res: Response) {
    const ministerioId = Number(req.params.ministerioId);
    if (!Number.isInteger(ministerioId) || ministerioId <= 0) {
        return res.status(400).json({ message: 'ministerioId inválido!' });
    }
    // Descrição só p/ gestor; membro comum vê os períodos (sem o texto sensível).
    const gestor = podeGerir(req);
    return res.status(200).json(await listarPorMinisterio(ministerioId, gestor));
}

/** POST /indisponibilidades — cria (própria ou, se gestor, de outro membro). */
export async function criarController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const alvo = Number.isInteger(req.body?.membroId) ? req.body.membroId : req.user.id;
    if (alvo !== req.user.id && !podeGerir(req)) {
        return res.status(403).json({ message: 'Sem permissão para outro membro!' });
    }
    const parsed = parseCorpo(req.body);
    if ('erro' in parsed) return res.status(400).json({ message: parsed.erro });

    const criada = await criar({
        membroId: alvo,
        ministerioId: parsed.ministerioId,
        descricao: parsed.descricao,
        periodo: parsed.periodo,
        dataInicio: parsed.dataInicio,
        dataFim: parsed.dataFim,
        recorrencia: parsed.recorrencia,
    });
    return res.status(201).json(criada);
}

/** PUT /indisponibilidades/:id */
export async function atualizarController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const id = Number(req.params.id);
    const atual = await findById(id);
    if (!atual) return res.status(404).json({ message: 'Indisponibilidade não encontrada!' });
    if (atual.membro_id !== req.user.id && !podeGerir(req)) {
        return res.status(403).json({ message: 'Sem permissão!' });
    }
    const parsed = parseCorpo(req.body);
    if ('erro' in parsed) return res.status(400).json({ message: parsed.erro });

    const atualizada = await atualizar(id, {
        descricao: parsed.descricao,
        periodo: parsed.periodo,
        dataInicio: parsed.dataInicio,
        dataFim: parsed.dataFim,
        recorrencia: parsed.recorrencia,
    });
    return res.status(200).json(atualizada);
}

/** DELETE /indisponibilidades/:id */
export async function deletarController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const id = Number(req.params.id);
    const atual = await findById(id);
    if (!atual) return res.status(404).json({ message: 'Indisponibilidade não encontrada!' });
    if (atual.membro_id !== req.user.id && !podeGerir(req)) {
        return res.status(403).json({ message: 'Sem permissão!' });
    }
    await deletar(id);
    return res.status(200).json({ message: 'Indisponibilidade removida!' });
}
