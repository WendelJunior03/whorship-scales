import { describe, it, expect } from 'vitest';
import { podeUsar, planoPermite, planoAtendeMinimo, LIBERAR_TUDO_V1 } from './recursos';

describe('podeUsar (catálogo + flags)', () => {
    it('libera recurso PRO com flag ativa mesmo p/ org free (v1: plano sempre libera)', () => {
        expect(podeUsar({ plano: 'free' }, 'samples.upload')).toBe(true);
    });

    it('libera recurso PRO com flag ativa também p/ org pro', () => {
        expect(podeUsar({ plano: 'pro' }, 'samples.upload')).toBe(true);
    });

    it('nega recurso com flag desligada, independente do plano (feature não lançada)', () => {
        expect(podeUsar({ plano: 'free' }, 'backup.automatico')).toBe(false);
        expect(podeUsar({ plano: 'pro' }, 'backup.automatico')).toBe(false);
    });

    it('lança erro se o recurso não existir no catálogo', () => {
        expect(() => podeUsar({ plano: 'pro' }, 'recurso.inexistente')).toThrow('Recurso não encontrado');
    });
});

describe('planoPermite (eixo de plano)', () => {
    it('na v1 retorna sempre true (LIBERAR_TUDO_V1 ligado)', () => {
        expect(LIBERAR_TUDO_V1).toBe(true);
        expect(planoPermite('free', 'pro')).toBe(true);
        expect(planoPermite('pro', 'free')).toBe(true);
    });
});

describe('planoAtendeMinimo (regra que passa a valer ao virar a chave)', () => {
    it('free NÃO atende recurso que exige pro', () => {
        expect(planoAtendeMinimo('free', 'pro')).toBe(false);
    });
    it('pro atende recurso pro e recurso free', () => {
        expect(planoAtendeMinimo('pro', 'pro')).toBe(true);
        expect(planoAtendeMinimo('pro', 'free')).toBe(true);
    });
    it('free atende recurso free', () => {
        expect(planoAtendeMinimo('free', 'free')).toBe(true);
    });
});
