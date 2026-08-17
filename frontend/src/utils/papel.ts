import { Papel, PapelOrg, PapelMinisterio } from '@/types';

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

// --- Eixo organizacional (spec 02) ---

export const papelOrgLabel: Record<PapelOrg, string> = {
  administrador: 'Administrador',
  lider: 'Líder',
  membro: 'Membro',
};

export const papelOrgTone: Record<PapelOrg, 'primary' | 'neutral'> = {
  administrador: 'primary',
  lider: 'primary',
  membro: 'neutral',
};

export const papelMinisterioLabel: Record<PapelMinisterio, string> = {
  ministro: 'Ministro',
  vocal: 'Vocal',
  instrumentista: 'Instrumentista',
};

/** Subconjunto de Membro que as checagens de permissão precisam. */
type UsuarioPapel = {
  papel: Papel;
  papel_org?: PapelOrg;
  papel_ministerio?: PapelMinisterio | null;
};

/** Deriva o eixo organizacional do papel legado (fallback p/ sessões antigas). */
function papelOrgDerivado(papel: Papel): PapelOrg {
  return papel === 'admin' ? 'administrador' : 'membro';
}

/** Papel organizacional do usuário (usa papel_org; cai no legado se ausente). */
export function papelOrgDe(user: UsuarioPapel): PapelOrg {
  return user.papel_org ?? papelOrgDerivado(user.papel);
}

/** É administrador da organização? (gestão de membros, convites, cadastro). */
export function isAdmin(user: UsuarioPapel): boolean {
  return papelOrgDe(user) === 'administrador';
}

/**
 * Tem acesso de GESTÃO (agenda de todos, gerenciar escalas/repertório)?
 * Administrador (eixo org) OU ministro (eixo musical). Fallback: papel legado.
 */
export function podeGerir(user: UsuarioPapel): boolean {
  if (user.papel_org || user.papel_ministerio) {
    return papelOrgDe(user) === 'administrador' || user.papel_ministerio === 'ministro';
  }
  return isGestor(user.papel);
}

/**
 * @deprecated Use `podeGerir(user)` — baseado nos dois eixos (spec 02).
 * Mantido só pra compat (checagem pelo papel legado).
 */
export function isGestor(papel: Papel): boolean {
  return papel === 'admin' || papel === 'ministro';
}
