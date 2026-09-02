import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mocka o model p/ não tocar no banco.
vi.mock('../models/apiTokenModel', () => ({
    buscarPorHash: vi.fn(),
    marcarUso: vi.fn().mockResolvedValue(undefined),
}));

import { apiTokenAuth, somenteLeitura } from './apiTokenAuthMiddleware';
import { buscarPorHash } from '../models/apiTokenModel';

const buscarMock = vi.mocked(buscarPorHash);

function fakeRes() {
    const res: any = { statusCode: 200, body: undefined };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    return res;
}

function fakeReq(header?: string, method = 'GET'): Request {
    return { method, header: (_n: string) => header } as unknown as Request;
}

describe('apiTokenAuth', () => {
    beforeEach(() => buscarMock.mockReset());

    it('401 sem header Authorization', async () => {
        const res = fakeRes();
        let passou = false;
        await apiTokenAuth(fakeReq(undefined), res as Response, () => { passou = true; });
        expect(passou).toBe(false);
        expect(res.statusCode).toBe(401);
    });

    it('401 com token inexistente', async () => {
        buscarMock.mockResolvedValue(undefined);
        const res = fakeRes();
        let passou = false;
        await apiTokenAuth(fakeReq('Bearer wsk_naoexiste'), res as Response, () => { passou = true; });
        expect(passou).toBe(false);
        expect(res.statusCode).toBe(401);
    });

    it('token válido escopa a org e segue', async () => {
        buscarMock.mockResolvedValue({ id: 1, org_id: 7, ministerio_id: null });
        const req = fakeReq('Bearer wsk_valido');
        const res = fakeRes();
        let passou = false;
        await apiTokenAuth(req, res as Response, () => { passou = true; });
        expect(passou).toBe(true);
        expect(req.orgId).toBe(7);
    });
});

describe('somenteLeitura', () => {
    it('deixa passar GET', () => {
        let passou = false;
        somenteLeitura(fakeReq(undefined, 'GET'), fakeRes() as Response, () => { passou = true; });
        expect(passou).toBe(true);
    });

    it('bloqueia POST com 405', () => {
        const res = fakeRes();
        let passou = false;
        somenteLeitura(fakeReq(undefined, 'POST'), res as Response, () => { passou = true; });
        expect(passou).toBe(false);
        expect(res.statusCode).toBe(405);
    });
});
