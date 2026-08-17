import { query, unscopedQuery } from '../config/database';
import { derivarPapeis } from '../utils/papeis';

export async function createMembers(
    name: string,
    phone: string,
    instrument: string,
    email: string,
    role: string,
    password: string,
    orgId: number) {

    // Deriva os dois eixos de papel (spec 02) a partir do papel legado informado.
    const { papelOrg, papelMinisterio } = derivarPapeis(role);

    const result = await query(
        'INSERT INTO membros (nome, telefone, instrumento, email, papel, papel_org, papel_ministerio, senha, org_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [name, phone, instrument, email, role, papelOrg, papelMinisterio, password, orgId],
    );

    return result.rows[0];

}

export async function findByEmail(email: string) {
    // Login roda pré-auth (ainda não há org na sessão) e o email é único global →
    // busca cross-tenant legítima. Precisa de bypass, senão o RLS devolve 0 linhas.
    const membro = await unscopedQuery('SELECT * FROM membros WHERE email = $1', [email])

    return membro.rows[0];
}

export async function findById(id: number) {
    const membro = await query('SELECT id, nome, telefone, instrumento, email, papel FROM membros WHERE ativo = true AND id = $1', [id])
    return membro.rows[0];
}

export async function findAllMembers() {
    const membros = await query('SELECT id, nome, telefone, instrumento, email, papel FROM membros WHERE ativo = true');
    return membros.rows;
}

export async function updateMember(id: number, name: string, phone: string, instrument: string, email: string, role?: string) {
    if (role) {
        const alteracoes = await query('UPDATE membros SET nome = $1, telefone = $2, instrumento = $3, email = $4, papel = $5 WHERE id = $6 RETURNING *', [name, phone, instrument, email, role, id]);
        return alteracoes.rows[0];
    }
    const alteracoes = await query('UPDATE membros SET nome = $1, telefone = $2, instrumento = $3, email = $4 WHERE id = $5 RETURNING *', [name, phone, instrument, email, id]);
    return alteracoes.rows[0];
}

export async function deactivateMember(id: number, ative: boolean) {
    const alteracoes = await query('UPDATE membros SET ativo = $1 WHERE id = $2 RETURNING *', [ative, id]);
    return alteracoes.rows[0]
}

export async function findByIdComSenha(id: number) {
    const result = await query('SELECT * FROM membros WHERE ativo = true AND id = $1', [id]);
    return result.rows[0];
}

export async function updatePassword(id: number, hashPassword: string) {
    const result = await query('UPDATE membros SET senha = $1 WHERE id = $2 RETURNING *', [hashPassword, id]);
    return result.rows[0];
}

export async function findAdminsAtivos() {
    const result = await query("SELECT id FROM membros WHERE papel = 'admin' AND ativo = true");
    return result.rows;
}