import { pool, query } from '../config/database';
import { gerarOrgCode } from '../utils/orgCode';
import { slugify } from '../utils/slug';

export async function buscarOrgPorCodigo(codigo: string) {
    const result = await query('SELECT * FROM organizacoes WHERE codigo = $1', [codigo]);
    return result.rows[0];
}

export async function buscarOrgPorId(id: number) {
    const result = await query('SELECT id, nome, codigo, slug, plano, criado_por, created_at FROM organizacoes WHERE id = $1', [id]);
    return result.rows[0];
}

async function codigoExiste(codigo: string): Promise<boolean> {
    const result = await query('SELECT 1 FROM organizacoes WHERE codigo = $1', [codigo]);
    return result.rows.length > 0;
}

/**
 * Gera um código `PREFIXO-XXXXXX` garantindo unicidade no banco (regenera o
 * sufixo em caso de colisão). Cobre a decisão D-01.3 da spec 01.
 */
export async function gerarCodigoUnico(prefixo: string, maxTentativas = 10): Promise<string> {
    for (let i = 0; i < maxTentativas; i++) {
        const codigo = gerarOrgCode(prefixo);
        if (!(await codigoExiste(codigo))) {
            return codigo;
        }
    }
    throw new Error('Não foi possível gerar um código único para a organização');
}

interface NovaOrgComAdmin {
    nomeOrg: string;
    prefixo: string;
    nome: string;
    email: string;
    senhaHash: string;
    telefone: string;
    instrumento: string;
}

/**
 * Cria a organização e o membro admin em uma única transação, resolvendo a
 * dependência circular (organizacoes.criado_por <-> membros.org_id):
 * insere a org, insere o admin vinculado a ela e então preenche `criado_por`.
 */
export async function criarOrganizacaoComAdmin(dados: NovaOrgComAdmin) {
    const codigo = await gerarCodigoUnico(dados.prefixo);
    const sufixo = codigo.slice(codigo.indexOf('-') + 1).toLowerCase();
    const slug = `${slugify(dados.nomeOrg) || 'org'}-${sufixo}`;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const org = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano)
             VALUES ($1, $2, $3, 'free') RETURNING *`,
            [dados.nomeOrg, codigo, slug],
        )).rows[0];

        const membro = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumento, email, papel, senha, org_id)
             VALUES ($1, $2, $3, $4, 'admin', $5, $6) RETURNING *`,
            [dados.nome, dados.telefone, dados.instrumento, dados.email, dados.senhaHash, org.id],
        )).rows[0];

        await client.query('UPDATE organizacoes SET criado_por = $1 WHERE id = $2', [membro.id, org.id]);

        await client.query('COMMIT');
        return { org: { ...org, criado_por: membro.id }, membro };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
