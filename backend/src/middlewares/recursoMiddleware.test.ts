/**
 * Passo 6 — teste do gating de recurso (spec 03, T-03.3).
 * Prova que dá pra marcar uma rota como PRO e o ponto de checagem funciona:
 *  - flag ligada → passa (v1: plano não bloqueia);
 *  - flag desligada → 403 (feature não lançada);
 *  - sem org → 401.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mocka o model p/ não tocar no banco (e não abrir o pool do database.ts).
vi.mock('./../models/organizacaoModel', () => ({
    buscarOrgPorId: vi.fn(),
}));

import { requerRecurso } from './recursoMiddleware';
import { buscarOrgPorId } from '../models/organizacaoModel';

const buscarOrgMock = vi.mocked(buscarOrgPorId);

function fakeRes() {
    const res: any = { statusCode: 200, body: undefined };
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (body: unknown) => { res.body = body; return res; };
    return res;
}

async function roda(orgId: number | undefined, plano: 'free' | 'pro', chave: string) {
    buscarOrgMock.mockResolvedValue(orgId ? { id: orgId, plano } : undefined);
    const req = { orgId } as unknown as Request;
    const res = fakeRes();
    let passou = false;
    await requerRecurso(chave)(req, res as Response, () => { passou = true; });
    return { passou, status: res.statusCode, body: res.body };
}

describe('requerRecurso', () => {
    beforeEach(() => buscarOrgMock.mockReset());

    it('deixa passar recurso com flag ativa (v1: org free liberada)', async () => {
        const r = await roda(1, 'free', 'samples.upload');
        expect(r).toMatchObject({ passou: true, status: 200 });
    });

    it('bloqueia (403) recurso com flag desligada, com dica de upgrade', async () => {
        const r = await roda(1, 'pro', 'backup.automatico');
        expect(r.passou).toBe(false);
        expect(r.status).toBe(403);
        expect(r.body).toMatchObject({ recurso: 'backup.automatico', upgrade: true });
    });

    it('exige autenticação/org (401 sem orgId)', async () => {
        const r = await roda(undefined, 'free', 'samples.upload');
        expect(r).toMatchObject({ passou: false, status: 401 });
    });
});
