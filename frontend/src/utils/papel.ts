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
