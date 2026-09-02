import { describe, it, expect } from 'vitest';
import { gerarApiToken, hashApiToken } from './apiToken';

describe('apiToken', () => {
    it('gera token com prefixo wsk_ e hash conferindo', () => {
        const { token, hash, prefixo } = gerarApiToken();
        expect(token.startsWith('wsk_')).toBe(true);
        expect(prefixo).toBe(token.slice(0, 12));
        expect(hash).toBe(hashApiToken(token));
        // hash sha-256 em hex tem 64 chars e NÃO contém o token em claro.
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(hash).not.toContain(token);
    });

    it('gera tokens diferentes a cada chamada', () => {
        const a = gerarApiToken();
        const b = gerarApiToken();
        expect(a.token).not.toBe(b.token);
        expect(a.hash).not.toBe(b.hash);
    });

    it('hashApiToken é determinístico', () => {
        expect(hashApiToken('wsk_abc')).toBe(hashApiToken('wsk_abc'));
    });
});
