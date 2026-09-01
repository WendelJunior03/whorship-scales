import { describe, expect, it, beforeAll } from 'vitest';

describe('cripto (AES-256-GCM)', () => {
    beforeAll(() => {
        process.env.APP_ENC_KEY = 'chave-de-teste-bem-grande-123';
    });

    it('cifra e decifra de volta (round-trip)', async () => {
        const { cifrar, decifrar } = await import('./cripto');
        const segredo = 'refresh-token-secreto-abc.123';
        const pacote = cifrar(segredo);
        expect(pacote).not.toContain(segredo); // não fica em claro
        expect(pacote.split('.').length).toBe(3); // iv.tag.dados
        expect(decifrar(pacote)).toBe(segredo);
    });

    it('decifrar falha com pacote adulterado', async () => {
        const { cifrar, decifrar } = await import('./cripto');
        const pacote = cifrar('x');
        const [iv, tag] = pacote.split('.');
        expect(() => decifrar(`${iv}.${tag}.AAAA`)).toThrow();
    });

    it('rejeita auth tag truncado (menor que 16 bytes)', async () => {
        const { cifrar, decifrar } = await import('./cripto');
        const pacote = cifrar('x');
        const [iv, tag, dados] = pacote.split('.');
        // Trunca o tag para 8 bytes (base64 de 8 bytes tem 12 chars) — deve ser recusado.
        const tagCurto = Buffer.from(tag, 'base64').subarray(0, 8).toString('base64');
        expect(() => decifrar(`${iv}.${tagCurto}.${dados}`)).toThrow('Auth tag inválido.');
    });
});
