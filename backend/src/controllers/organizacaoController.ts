import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { findByEmail, createMembers } from '../models/membroModel';
import {
    buscarOrgPorCodigo,
    buscarOrgPorId,
    criarOrganizacaoComAdmin,
} from '../models/organizacaoModel';
import { gerarPrefixo } from '../utils/orgCode';
import { assinarTokenMembro } from '../utils/token';

/**
 * Cria uma nova organização e o primeiro usuário como admin dela.
 * Fluxo público de cadastro (spec 01, T-01.5).
 */
export async function criarOrganizacao(req: Request, res: Response) {
    const { nomeOrg, prefixo, name, email, passwordUser, phone, instrument } = req.body;

    if (!nomeOrg || !name || !email || !passwordUser) {
        return res.status(400).json({ message: 'Informe nome da organização, nome, email e senha!' });
    }

    const emailDuplicate = await findByEmail(email);
    if (emailDuplicate) {
        return res.status(400).json({ message: 'Email duplicado' });
    }

    const prefixoFinal = prefixo?.trim()
        ? prefixo.trim().toUpperCase()
        : gerarPrefixo(nomeOrg);

    const hashPassword = await bcrypt.hash(passwordUser, 10);

    const { org, membro } = await criarOrganizacaoComAdmin({
        nomeOrg,
        prefixo: prefixoFinal,
        nome: name,
        email,
        senhaHash: hashPassword,
        telefone: phone,
        instrumento: instrument,
    });

    const token = assinarTokenMembro({
        id: membro.id,
        papel: membro.papel,
        papel_org: membro.papel_org,
        papel_ministerio: membro.papel_ministerio,
        org_id: org.id,
    });

    return res.status(201).json({
        token,
        organizacao: { id: org.id, nome: org.nome, codigo: org.codigo },
        message: 'Organização criada com sucesso!',
    });
}

/**
 * Entra em uma organização existente via código de convite, criando o membro.
 * Fluxo público de cadastro (spec 01, T-01.5).
 */
export async function entrarComCodigo(req: Request, res: Response) {
    const { codigo, name, email, passwordUser, phone, instrument } = req.body;

    if (!codigo || !name || !email || !passwordUser) {
        return res.status(400).json({ message: 'Informe o código da organização, nome, email e senha!' });
    }

    const org = await buscarOrgPorCodigo(codigo.trim().toUpperCase());
    if (!org) {
        return res.status(404).json({ message: 'Código de organização inválido!' });
    }

    const emailDuplicate = await findByEmail(email);
    if (emailDuplicate) {
        return res.status(400).json({ message: 'Email duplicado' });
    }

    const hashPassword = await bcrypt.hash(passwordUser, 10);

    // Quem entra por código nasce como 'membro' (papéis maiores vêm no RBAC — spec 02).
    const membro = await createMembers(name, phone, instrument, email, 'membro', hashPassword, org.id);

    const token = assinarTokenMembro({
        id: membro.id,
        papel: membro.papel,
        papel_org: membro.papel_org,
        papel_ministerio: membro.papel_ministerio,
        org_id: org.id,
    });

    return res.status(201).json({
        token,
        organizacao: { id: org.id, nome: org.nome },
        message: 'Você entrou na organização com sucesso!',
    });
}

/**
 * Retorna a organização atual do usuário logado (para exibir/compartilhar o
 * código de convite). Requer autenticação.
 */
export async function minhaOrganizacao(req: Request, res: Response) {
    if (!req.orgId) {
        return res.status(401).json({ message: 'Não autenticado!' });
    }

    const org = await buscarOrgPorId(req.orgId);
    if (!org) {
        return res.status(404).json({ message: 'Organização não encontrada!' });
    }

    return res.status(200).json(org);
}
