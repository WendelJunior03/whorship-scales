/**
 * Passo 5 — testes de autorização por capacidade (spec 02, T-02.6).
 * "Pronto quando: um membro recebe 403 em ações de admin/líder."
 */
import { describe, it, expect } from 'vitest';
import type { Request, Response } from 'express';
import { autoriza } from './roleMiddleware';

// res falso mínimo (status/json encadeáveis). `any` evita brigar com os genéricos
// de Response do Express — o teste só observa o statusCode.
function fakeRes() {
    const res: any = { statusCode: 200, body: undefined };
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (body: unknown) => { res.body = body; return res; };
    return res;
}

// Roda o middleware e devolve {passou, status} — passou = chamou next().
function roda(user: Record<string, unknown> | undefined, capacidade: string) {
    const req = { user } as unknown as Request;
    const res = fakeRes();
    let passou = false;
    autoriza(capacidade)(req, res as Response, () => {
        passou = true;
    });
    return { passou, status: res.statusCode };
}

const administrador = { id: 1, papel_org: 'administrador', papel_ministerio: null };
const lider = { id: 2, papel_org: 'lider', papel_ministerio: null };
const membro = { id: 3, papel_org: 'membro', papel_ministerio: null };
const ministro = { id: 4, papel_org: 'membro', papel_ministerio: 'ministro' };
const vocal = { id: 5, papel_org: 'membro', papel_ministerio: 'vocal' };

describe('autoriza (RBAC por capacidade)', () => {
    it('administrador passa em ação de admin (membro.cadastrar)', () => {
        expect(roda(administrador, 'membro.cadastrar')).toEqual({ passou: true, status: 200 });
    });

    it('membro comum recebe 403 em ação de admin (membro.cadastrar)', () => {
        expect(roda(membro, 'membro.cadastrar')).toEqual({ passou: false, status: 403 });
    });

    it('líder recebe 403 em ação exclusiva de admin (membro.cadastrar)', () => {
        expect(roda(lider, 'membro.cadastrar')).toEqual({ passou: false, status: 403 });
    });

    it('ministro passa em escala.gerenciar (libera pelo eixo musical)', () => {
        expect(roda(ministro, 'escala.gerenciar')).toEqual({ passou: true, status: 200 });
    });

    it('vocal recebe 403 em escala.gerenciar (só ministro libera pelo eixo musical)', () => {
        expect(roda(vocal, 'escala.gerenciar')).toEqual({ passou: false, status: 403 });
    });

    it('membro recebe 403 em ação de gestão de repertório', () => {
        expect(roda(membro, 'repertorio.gerenciar')).toEqual({ passou: false, status: 403 });
    });

    it('token antigo sem papel_org recebe 403 (sessão desatualizada)', () => {
        expect(roda({ id: 9, papel: 'admin' }, 'membro.cadastrar')).toEqual({ passou: false, status: 403 });
    });
});
