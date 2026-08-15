import jwt from 'jsonwebtoken';

export interface DadosTokenMembro {
    id: number;
    papel: string;
    org_id: number;
}

/**
 * Assina o JWT de sessão do membro. Inclui `org_id` para o isolamento
 * multi-tenant (spec 01) — toda rota autenticada passa a saber a organização.
 */
export function assinarTokenMembro(membro: DadosTokenMembro): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }
    return jwt.sign(
        { id: membro.id, papel: membro.papel, org_id: membro.org_id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
    );
}
