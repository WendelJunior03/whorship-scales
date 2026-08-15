import { describe, it, expect } from 'vitest';
import { podeAcessar } from './capacidades';

describe('podeAcessar', () => {
it('deve retornar true se o usuário tiver a capacidade', () => {
  expect(podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'lideranca.convidar')).toBe(true);
});
it('deve retornar false se o usuário não tiver a capacidade', () => {
  expect(podeAcessar({ papelOrg: 'lider', papelMinisterio: null }, 'lideranca.convidar')).toBe(false);
  expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: null }, 'lideranca.convidar')).toBe(false);
});
it('deve retornar true se o usuário tiver a capacidade em mais de um papel', () => {
  expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: 'ministro' }, 'escala.gerenciar')).toBe(true);
});
it('deve retornar false se o usuário não tiver a capacidade em nenhum dos papéis', () => {
  expect(podeAcessar({ papelOrg: 'lider', papelMinisterio: 'vocal' }, 'culto.gerenciar')).toBe(false);
  expect(podeAcessar({ papelOrg: 'membro', papelMinisterio: 'vocal' }, 'culto.gerenciar')).toBe(false);
});
it('deve lançar erro se a capacidade não existir', () => {
   expect(() => podeAcessar({ papelOrg: 'administrador', papelMinisterio: null }, 'capacidade.inexistente')).toThrow('Capacidade não encontrada');
});
});