import type { PapelOrg, PapelMinisterio } from '../config/capacidades';

/**
 * Deriva os dois eixos de papel (spec 02, D-02.3) a partir do papel legado
 * (`admin` | `ministro` | `vocal` | `membro`). Fonte única do mapeamento —
 * a migration de RBAC faz o mesmo backfill para os dados existentes.
 *
 *   admin    → org: administrador · ministerio: null
 *   ministro → org: membro        · ministerio: ministro
 *   vocal    → org: membro        · ministerio: vocal
 *   membro   → org: membro        · ministerio: null
 */
export function derivarPapeis(papelLegado: string): {
    papelOrg: PapelOrg;
    papelMinisterio: PapelMinisterio | null;
} {
    if (papelLegado === 'admin') {
        return { papelOrg: 'administrador', papelMinisterio: null };
    }
    if (papelLegado === 'ministro') {
        return { papelOrg: 'membro', papelMinisterio: 'ministro' };
    }
    if (papelLegado === 'vocal') {
        return { papelOrg: 'membro', papelMinisterio: 'vocal' };
    }
    return { papelOrg: 'membro', papelMinisterio: null };
}
