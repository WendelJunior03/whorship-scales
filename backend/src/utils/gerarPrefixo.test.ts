import { describe, it, expect } from 'vitest';
import { gerarPrefixo, gerarOrgCode } from './orgCode';

describe('gerarPrefixo', () => {
  it('gera sigla com duas palavras', () => {
    expect(gerarPrefixo('Quadrangular Guarani')).toBe('QG');
  });

  it('gera sigla com mais de duas palavras', () => {
    expect(gerarPrefixo('Quadrangular Guarani Betel')).toBe('QGB');
  });

  it('usa fallback de 2 letras para palavra única', () => {
    expect(gerarPrefixo('Betel')).toBe('BE');
  });

  it('remove acentos antes de gerar a sigla', () => {
    expect(gerarPrefixo('Ação Ágil')).toBe('AA');
  });

  it('ignora espaços extras entre palavras', () => {
    expect(gerarPrefixo('Copa   de   Verão')).toBe('CDV');
  });

  it('lança erro se a string for vazia', () => {
    expect(() => gerarPrefixo('')).toThrow('Prefixo não fornecido!');
  });

  it('lança erro se a string tiver só espaços', () => {
    expect(() => gerarPrefixo('   ')).toThrow('Prefixo não fornecido!');
  });
});

describe('gerarOrgCode', () => {
  it('gera código no formato PREFIXO-XXXXXX', () => {
    const codigo = gerarOrgCode('QG');
    expect(codigo).toMatch(/^QG-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('lança erro se o prefixo for vazio', () => {
    expect(() => gerarOrgCode('')).toThrow('Prefixo não fornecido para gerar OrgCode');
  });

  it('gera sufixos diferentes em chamadas sucessivas (probabilístico)', () => {
    const a = gerarOrgCode('QG');
    const b = gerarOrgCode('QG');
    expect(a).not.toBe(b); 
  });
});