import { describe, it, expect } from 'vitest';
import { podeUsar, planoPermite } from './recursos';

describe('podeUsar', () => {
  it('libera recurso com flag ativa, mesmo para org no plano free (v1: plano sempre libera)', () => {
    expect(podeUsar({ plano: 'free' }, 'exemplo.recurso')).toBe(true);
  });

  it('libera recurso com flag ativa também para org no plano pro', () => {
    expect(podeUsar({ plano: 'pro' }, 'exemplo.recurso')).toBe(true);
  });

  it('nega recurso com flag desativada, independente do plano', () => {
    expect(podeUsar({ plano: 'free' }, 'exemplo.recurso_desativado')).toBe(false);
    expect(podeUsar({ plano: 'pro' }, 'exemplo.recurso_desativado')).toBe(false);
  });

  it('lança erro se o recurso não existir no catálogo', () => {
    expect(() => podeUsar({ plano: 'pro' }, 'recurso.inexistente')).toThrow('Recurso não encontrado');
  });
});

describe('planoPermite', () => {
  it('retorna sempre true na v1, independente da combinação de planos', () => {
    expect(planoPermite('free', 'pro')).toBe(true);
    expect(planoPermite('pro', 'free')).toBe(true);
  });
});
