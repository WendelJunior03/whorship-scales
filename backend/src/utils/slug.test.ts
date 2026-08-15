import { describe, it, expect } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
    it('troca espaços por hifens e deixa minúsculo', () => {
        expect(slugify('Quadrangular Guarani')).toBe('quadrangular-guarani');
    });

    it('remove acentos', () => {
        expect(slugify('Ação e Coração')).toBe('acao-e-coracao');
    });

    it('colapsa separadores e apara hifens das pontas', () => {
        expect(slugify('  Igreja   Central!!  ')).toBe('igreja-central');
    });

    it('retorna vazio para string só de símbolos', () => {
        expect(slugify('---')).toBe('');
    });
});
