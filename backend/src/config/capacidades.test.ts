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

  it('libera qualquer papelOrg em capacidade aberta a todos (escalacao.confirmar)', () => {
    expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: null }, 'escalacao.confirmar')).toBe(true);
    expect(podeAcessar({ papelOrg: 'lider', papelMinisterio: null }, 'escalacao.confirmar')).toBe(true);
    expect(podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'escalacao.confirmar')).toBe(true);
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

describe('mesmoUsuario', () => {
  it('retorna true quando o idDoRecurso bate com o usuarioId', () => {
    expect(mesmoUsuario(1, 1)).toBe(true);
  });

  it('retorna false quando o idDoRecurso é diferente do usuarioId', () => {
    expect(mesmoUsuario(1, 2)).toBe(false);
  });
});
