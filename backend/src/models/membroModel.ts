import { PoolClient } from 'pg';
import { query, unscopedQuery } from '../config/database';
import { derivarPapelLegado } from '../utils/papeis';
import { predicadoIndisponivel } from './indisponibilidadeModel';
import type { PapelOrg, PapelMinisterio } from '../config/capacidades';

/**
 * `client` opcional: quando informado (por ex. dentro de um `withBypass`), roda
 * nele em vez de cair no `query()` normal com escopo de tenant. Necessário pra
 * fluxos pré-auth e cross-tenant legítimos (entrar por código) — sem sessão de
 * org ainda, o RLS fail-closed bloqueia o INSERT.
 */
export async function createMembers(
    name: string,
    phone: string,
    instruments: string[],
    email: string,
    papelOrg: PapelOrg,
    papelMinisterio: PapelMinisterio | null,
    password: string,
    orgId: number,
    dataNascimento: string | null = null,
    client?: PoolClient) {

    // Papel legado (coluna `papel`) é só um reflexo dos dois eixos reais agora — ver
    // `derivarPapelLegado` sobre por que ele ainda existe.
    const papelLegado = derivarPapelLegado(papelOrg, papelMinisterio);

    const sql = 'INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *';
    const params = [name, phone, instruments, email, papelLegado, papelOrg, papelMinisterio, password, orgId, dataNascimento];
    const result = client ? await client.query(sql, params) : await query(sql, params);

    return result.rows[0];

}

export async function findByEmail(email: string) {
    // Login roda pré-auth (ainda não há org na sessão) e o email é único global →
    // busca cross-tenant legítima. Precisa de bypass, senão o RLS devolve 0 linhas.
    const membro = await unscopedQuery('SELECT * FROM membros WHERE email = $1', [email])

    return membro.rows[0];
}

export async function findById(id: number) {
    const membro = await query("SELECT id, nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento FROM membros WHERE ativo = true AND id = $1", [id])
    return membro.rows[0];
}

export async function findAllMembers() {
    const membros = await query("SELECT id, nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento FROM membros WHERE ativo = true");
    return membros.rows;
}

export async function updateMember(
    id: number,
    name: string,
    phone: string,
    instruments: string[],
    email: string,
    papelOrg: PapelOrg,
    papelMinisterio: PapelMinisterio | null,
    dataNascimento: string | null = null,
) {
    // `papelMinisterio` é sempre recalculado a partir dos instrumentos (também quando
    // quem edita não é admin) — só `papelOrg` exige a capacidade `membro.papel.alterar`,
    // já validada no controller antes de chegar aqui.
    const papelLegado = derivarPapelLegado(papelOrg, papelMinisterio);
    const alteracoes = await query(
        'UPDATE membros SET nome = $1, telefone = $2, instrumentos = $3, email = $4, papel = $5, papel_org = $6, papel_ministerio = $7, data_nascimento = $8 WHERE id = $9 RETURNING *',
        [name, phone, instruments, email, papelLegado, papelOrg, papelMinisterio, dataNascimento, id],
    );
    return alteracoes.rows[0];
}

/**
 * Aniversariantes de um mês (1–12), da org (RLS). Ordena por dia. Retorna a
 * data já normalizada e o dia extraído pra facilitar o calendário/lista.
 * `ministerioId` opcional restringe a quem está naquele ministério.
 */
export async function findAniversariantesDoMes(mes: number, ministerioId?: number) {
    const params: number[] = [mes];
    let filtroMinisterio = '';
    if (ministerioId) {
        params.push(ministerioId);
        filtroMinisterio = `AND id IN (
            SELECT membro_id FROM ministerio_membros WHERE ministerio_id = $${params.length}
        )`;
    }
    const result = await query(
        `SELECT id, nome, email,
                to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
                EXTRACT(DAY FROM data_nascimento)::int AS dia
           FROM membros
          WHERE ativo = true
            AND data_nascimento IS NOT NULL
            AND EXTRACT(MONTH FROM data_nascimento) = $1
            ${filtroMinisterio}
          ORDER BY dia ASC, nome ASC`,
        params,
    );
    return result.rows;
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

/**
 * Membros ativos que dá pra indicar como substituto num culto específico —
 * exclui quem está indicando e quem já está escalado (vocal ou avulsa, com
 * status diferente de recusado) nesse mesmo culto. `papel` filtra por papel
 * legado quando informado (ex.: só vocais pra indicação de escala de vocal).
 */
export async function findMembrosDisponiveisParaCulto(cultoId: number, excluirMembroId: number, papel?: string) {
    const params: (number | string)[] = [cultoId, excluirMembroId];
    let filtroPapel = '';
    if (papel) {
        params.push(papel);
        filtroPapel = `AND membros.papel = $${params.length}`;
    }
    const indisponivel = predicadoIndisponivel('membros.id', '(SELECT data_hora FROM cultos WHERE id = $1)');
    const result = await query(
        `SELECT membros.id, membros.nome FROM membros
         WHERE membros.ativo = true AND membros.id <> $2 ${filtroPapel}
           AND membros.id NOT IN (
             SELECT membro_id FROM escala_vocal WHERE culto_id = $1 AND status <> 'recusado'
             UNION
             SELECT membro_id FROM escala_avulsa WHERE culto_id = $1 AND status <> 'recusado'
           )
           AND NOT ${indisponivel}
         ORDER BY membros.nome ASC`,
        params,
    );
    return result.rows;
}
