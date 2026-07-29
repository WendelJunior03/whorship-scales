import { Papel } from '@/types';

export const papelLabel: Record<Papel, string> = {
  admin: 'Admin',
  ministro: 'Ministro',
  vocal: 'Vocal',
  membro: 'Membro',
};

export const papelTone: Record<Papel, 'primary' | 'neutral'> = {
  admin: 'primary',
  ministro: 'primary',
  vocal: 'primary',
  membro: 'neutral',
};

/**
 * admin e ministro têm acesso de gestão (ver agenda de todos, gerenciar
 * membros/escalas/repertório) — vocal e membro só veem o que é próprio.
 * Ver docs/escalas-louvor-spec.md, seção "Resumo de permissões".
 */
export function isGestor(papel: Papel): boolean {
  return papel === 'admin' || papel === 'ministro';
}
