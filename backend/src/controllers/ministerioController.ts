import { Request, Response } from 'express';
import * as model from '../models/ministerioModel';
import { findById as buscarMembro } from '../models/membroModel';
import { buscarOrgPorId } from '../models/organizacaoModel';

// Ministérios (spec 11, módulo 1). A autorização por capacidade acontece na rota
// (autoriza('ministerio.*')); aqui ficam validação de input e regras de recurso.

function nomeValido(nome: unknown): string | null {
    if (!nome || !String(nome).trim()) return null;
    return String(nome).trim();
}

// --- Ministério ---

export async function criarMinisterioController(req: Request, res: Response) {
    const nome = nomeValido(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ message: 'Nome do ministério é obrigatório!' });
    }
    const descricao = req.body?.descricao ? String(req.body.descricao).trim() : null;
    const ministerio = await model.criarMinisterio(nome, descricao);
    return res.status(201).json(ministerio);
}

export async function listarMinisteriosController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarMinisterios());
}

export async function getMinisterioController(req: Request, res: Response) {
    const ministerio = await model.buscarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    return res.status(200).json(ministerio);
}

export async function atualizarMinisterioController(req: Request, res: Response) {
    const nome = nomeValido(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ message: 'Nome do ministério é obrigatório!' });
    }
    const descricao = req.body?.descricao ? String(req.body.descricao).trim() : null;
    const ministerio = await model.atualizarMinisterio(Number(req.params.id), nome, descricao);
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    return res.status(200).json(ministerio);
}

export async function apagarMinisterioController(req: Request, res: Response) {
    const ministerio = await model.apagarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    return res.status(200).json({ message: 'Ministério removido com sucesso!' });
}

// --- Membros do ministério ---

export async function listarMembrosController(req: Request, res: Response) {
    const ministerio = await model.buscarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    return res.status(200).json(await model.listarMembros(ministerio.id));
}

export async function adicionarMembroController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const membroId = Number(req.body?.membroId);
    const papel = req.body?.papel === 'administrador' ? 'administrador' : 'membro';

    if (!Number.isInteger(membroId) || membroId <= 0) {
        return res.status(400).json({ message: 'membroId inválido!' });
    }

    const ministerio = await model.buscarMinisterio(ministerioId);
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }

    // findById é escopado por RLS: só retorna se o membro for da MESMA org (evita
    // vincular membro de outra organização passando um id qualquer).
    const membro = await buscarMembro(membroId);
    if (!membro) {
        return res.status(404).json({ message: 'Membro não encontrado nesta organização!' });
    }

    // Limite de vagas do ministério. No plano PRO as vagas são ILIMITADAS (billing);
    // no Free vale o cap (10 grátis + eventuais extras legadas). O plano é lido do
    // banco (fonte da verdade que os webhooks do Stripe atualizam).
    if (!(await model.membroEstaNoMinisterio(ministerioId, membroId))) {
        const org = req.orgId ? await buscarOrgPorId(req.orgId) : undefined;
        const ilimitado = org?.plano === 'pro';
        if (!ilimitado) {
            const total = await model.contarMembros(ministerioId);
            const limite = ministerio.vagas_gratis + ministerio.vagas_extras;
            if (total >= limite) {
                return res.status(409).json({
                    message: `Limite de vagas do ministério atingido (${limite}). Assine o PRO para vagas ilimitadas.`,
                });
            }
        }
    }

    const vinculo = await model.adicionarMembro(ministerioId, membroId, papel);
    return res.status(201).json(vinculo);
}

export async function removerMembroController(req: Request, res: Response) {
    const removido = await model.removerMembro(Number(req.params.id), Number(req.params.membroId));
    if (!removido) {
        return res.status(404).json({ message: 'Vínculo não encontrado!' });
    }
    return res.status(200).json({ message: 'Membro removido do ministério!' });
}

// --- Funções ---

export async function listarFuncoesController(req: Request, res: Response) {
    return res.status(200).json(await model.listarFuncoes(Number(req.params.id)));
}

export async function criarFuncaoController(req: Request, res: Response) {
    const nome = nomeValido(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ message: 'Nome da função é obrigatório!' });
    }
    const ministerio = await model.buscarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    const icone = req.body?.icone ? String(req.body.icone).trim() : null;
    const funcao = await model.criarFuncao(ministerio.id, nome, icone);
    return res.status(201).json(funcao);
}

export async function apagarFuncaoController(req: Request, res: Response) {
    const funcao = await model.apagarFuncao(Number(req.params.funcaoId));
    if (!funcao) {
        return res.status(404).json({ message: 'Função não encontrada!' });
    }
    return res.status(200).json({ message: 'Função removida!' });
}

export async function atribuirFuncaoController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const membroId = Number(req.body?.membroId);
    const funcaoId = Number(req.body?.funcaoId);
    if (!Number.isInteger(membroId) || !Number.isInteger(funcaoId)) {
        return res.status(400).json({ message: 'membroId e funcaoId são obrigatórios!' });
    }
    if (!(await model.membroEstaNoMinisterio(ministerioId, membroId))) {
        return res.status(404).json({ message: 'Membro não pertence a este ministério!' });
    }
    const atribuicao = await model.atribuirFuncao(ministerioId, membroId, funcaoId);
    return res.status(201).json(atribuicao ?? { message: 'Função já atribuída.' });
}

export async function removerFuncaoDoMembroController(req: Request, res: Response) {
    const removido = await model.removerFuncaoDoMembro(Number(req.params.membroId), Number(req.params.funcaoId));
    if (!removido) {
        return res.status(404).json({ message: 'Atribuição não encontrada!' });
    }
    return res.status(200).json({ message: 'Função removida do membro!' });
}

// --- Equipes ---

export async function listarEquipesController(req: Request, res: Response) {
    return res.status(200).json(await model.listarEquipes(Number(req.params.id)));
}

export async function criarEquipeController(req: Request, res: Response) {
    const nome = nomeValido(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ message: 'Nome da equipe é obrigatório!' });
    }
    const ministerio = await model.buscarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    const equipe = await model.criarEquipe(ministerio.id, nome);
    return res.status(201).json(equipe);
}

export async function apagarEquipeController(req: Request, res: Response) {
    const equipe = await model.apagarEquipe(Number(req.params.equipeId));
    if (!equipe) {
        return res.status(404).json({ message: 'Equipe não encontrada!' });
    }
    return res.status(200).json({ message: 'Equipe removida!' });
}

export async function listarMembrosEquipeController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const equipeId = Number(req.params.equipeId);
    if (!(await model.equipeDoMinisterio(equipeId, ministerioId))) {
        return res.status(404).json({ message: 'Equipe não encontrada neste ministério!' });
    }
    return res.status(200).json(await model.listarMembrosEquipe(equipeId));
}

export async function adicionarMembroEquipeController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const equipeId = Number(req.params.equipeId);
    const membroId = Number(req.body?.membroId);
    if (!Number.isInteger(membroId) || membroId <= 0) {
        return res.status(400).json({ message: 'membroId inválido!' });
    }
    if (!(await model.equipeDoMinisterio(equipeId, ministerioId))) {
        return res.status(404).json({ message: 'Equipe não encontrada neste ministério!' });
    }
    if (!(await model.membroEstaNoMinisterio(ministerioId, membroId))) {
        return res.status(409).json({ message: 'Membro precisa pertencer ao ministério antes de entrar na equipe.' });
    }
    const vinculo = await model.adicionarMembroEquipe(equipeId, membroId);
    return res.status(201).json(vinculo ?? { message: 'Membro já está na equipe.' });
}

export async function removerMembroEquipeController(req: Request, res: Response) {
    const removido = await model.removerMembroEquipe(Number(req.params.equipeId), Number(req.params.membroId));
    if (!removido) {
        return res.status(404).json({ message: 'Vínculo não encontrado!' });
    }
    return res.status(200).json({ message: 'Membro removido da equipe!' });
}

// --- Classificações ---

export async function listarClassificacoesController(req: Request, res: Response) {
    return res.status(200).json(await model.listarClassificacoes(Number(req.params.id)));
}

export async function criarClassificacaoController(req: Request, res: Response) {
    const nome = nomeValido(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ message: 'Nome da classificação é obrigatório!' });
    }
    const ministerio = await model.buscarMinisterio(Number(req.params.id));
    if (!ministerio) {
        return res.status(404).json({ message: 'Ministério não encontrado!' });
    }
    const cor = req.body?.cor ? String(req.body.cor).trim() : null;
    const classificacao = await model.criarClassificacao(ministerio.id, nome, cor);
    return res.status(201).json(classificacao);
}

export async function apagarClassificacaoController(req: Request, res: Response) {
    const classificacao = await model.apagarClassificacao(Number(req.params.classificacaoId));
    if (!classificacao) {
        return res.status(404).json({ message: 'Classificação não encontrada!' });
    }
    return res.status(200).json({ message: 'Classificação removida!' });
}

export async function atribuirClassificacaoController(req: Request, res: Response) {
    const ministerioId = Number(req.params.id);
    const membroId = Number(req.body?.membroId);
    const classificacaoId = Number(req.body?.classificacaoId);
    if (!Number.isInteger(membroId) || !Number.isInteger(classificacaoId)) {
        return res.status(400).json({ message: 'membroId e classificacaoId são obrigatórios!' });
    }
    if (!(await model.classificacaoDoMinisterio(classificacaoId, ministerioId))) {
        return res.status(404).json({ message: 'Classificação não encontrada neste ministério!' });
    }
    if (!(await model.membroEstaNoMinisterio(ministerioId, membroId))) {
        return res.status(404).json({ message: 'Membro não pertence a este ministério!' });
    }
    const atribuicao = await model.atribuirClassificacao(membroId, classificacaoId);
    return res.status(201).json(atribuicao ?? { message: 'Classificação já atribuída.' });
}

export async function removerClassificacaoDoMembroController(req: Request, res: Response) {
    const removido = await model.removerClassificacaoDoMembro(Number(req.params.membroId), Number(req.params.classificacaoId));
    if (!removido) {
        return res.status(404).json({ message: 'Atribuição não encontrada!' });
    }
    return res.status(200).json({ message: 'Classificação removida do membro!' });
}
