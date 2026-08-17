import { describe, it, expect } from 'vitest';
import { derivarPapeis } from './papeis';

describe('derivarPapeis (mapeamento D-02.3)', () => {
    it('admin → administrador, sem papel musical', () => {
        expect(derivarPapeis('admin')).toEqual({ papelOrg: 'administrador', papelMinisterio: null });
    });

    it('ministro → membro no eixo org, ministro no eixo musical', () => {
        expect(derivarPapeis('ministro')).toEqual({ papelOrg: 'membro', papelMinisterio: 'ministro' });
    });

    it('vocal → membro no eixo org, vocal no eixo musical', () => {
        expect(derivarPapeis('vocal')).toEqual({ papelOrg: 'membro', papelMinisterio: 'vocal' });
    });

    it('membro → membro, sem papel musical', () => {
        expect(derivarPapeis('membro')).toEqual({ papelOrg: 'membro', papelMinisterio: null });
    });

    it('valor desconhecido cai no padrão seguro (membro comum)', () => {
        expect(derivarPapeis('qualquer')).toEqual({ papelOrg: 'membro', papelMinisterio: null });
    });
});
