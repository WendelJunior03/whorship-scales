import { describe, it, expect } from 'vitest';
import { podeAcessar, mesmoUsuario } from './capacidades';

describe('podeAcessar', () => {
  it('libera administrador em capacidade só organizacional', () => {
    expect(podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'membro.cadastrar')).toBe(true);
  });

  it('nega lider em capacidade que só administrador pode', () => {
    expect(podeAcessar({ papelOrg: 'lider', papelMinisterio: null }, 'membro.cadastrar')).toBe(false);
  });

  it('nega membro comum em capacidade só organizacional', () => {
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: null }, 'membro.cadastrar')).toBe(false);
  });

  it('libera ministro em escala.gerenciar mesmo sendo só membro no papelOrg', () => {
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: 'ministro' }, 'escala.gerenciar')).toBe(true);
  });

  it('nega vocal em escala.gerenciar (só ministro libera pelo eixo musical)', () => {
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: 'vocal' }, 'escala.gerenciar')).toBe(false);
  });

  it('nega todo mundo via papelOrg em capacidade escopo:proprio pura (escalacao.confirmar) — nenhum papel dá acesso geral', () => {
    // papelOrg/papelMinisterio vazios de propósito: só mesmoUsuario pode liberar essa capacidade.
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: null }, 'escalacao.confirmar')).toBe(false);
    expect(podeAcessar({ papelOrg: 'lider', papelMinisterio: null }, 'escalacao.confirmar')).toBe(false);
    expect(podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'escalacao.confirmar')).toBe(false);
  });

  it('nega todo mundo, inclusive administrador, em capacidade escopo:proprio sem papelOrg/papelMinisterio (membro.senha.alterar)', () => {
    // podeAcessar não consulta o campo escopo — quem confirma "é o mesmo usuário?" é a mesmoUsuario, separada.
    expect(podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'membro.senha.alterar')).toBe(false);
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: null }, 'membro.senha.alterar')).toBe(false);
  });

  it('lança erro se a capacidade não existir no mapa', () => {
    expect(() => podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'capacidade.inexistente')).toThrow('Capacidade não encontrada');
  });
});

describe('podeAcessar + mesmoUsuario combinados (escopo: proprio)', () => {
  const membro = { papelOrg: 'membro' as const, papelMinisterio: null };

  it('libera membro confirmando a PRÓPRIA presença', () => {
    const idDoRecurso = 1;
    const usuarioId = 1;
    expect(podeAcessar(membro, 'escalacao.confirmar') || mesmoUsuario(idDoRecurso, usuarioId)).toBe(true);
  });

  it('nega membro confirmando presença de OUTRA pessoa', () => {
    const idDoRecurso = 2; // a escalação é de outro membro
    const usuarioId = 1;   // quem está pedindo
    expect(podeAcessar(membro, 'escalacao.confirmar') || mesmoUsuario(idDoRecurso, usuarioId)).toBe(false);
  });
});

describe('mesmoUsuario', () => {
  it('retorna true quando o idDoRecurso bate com o usuarioId', () => {
    expect(mesmoUsuario(1, 1)).toBe(true);
  });

  it('retorna false quando o idDoRecurso é diferente do usuarioId', () => {
    expect(mesmoUsuario(1, 2)).toBe(false);
  });
});
