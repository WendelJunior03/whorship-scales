/**
 * Passo 4 — teste de isolamento por organização (spec 01).
 *
 * Prova ZERO vazamento entre duas orgs (A não lê/edita/apaga nada de B) exercitando
 * a camada de RLS do Postgres. É um teste de INTEGRAÇÃO: precisa do banco com as
 * migrations aplicadas e do app conectando como `deepscales_app` (não-superusuário).
 *
 * Pula automaticamente (sem falhar `npm test`) quando:
 *   - o banco não está acessível, ou
 *   - a conexão é superusuário (que IGNORA RLS → o teste não teria sentido).
 *     Nesse caso configure APP_DATABASE_URL para o role deepscales_app.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool, tenantStorage, query, withBypass } from './database';

// Executa `fn` dentro do contexto de tenant de uma org (como o authMiddleware faz).
function comOrg<T>(orgId: number, fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run({ orgId }, fn);
}

let pular = false;
let motivo = '';
let orgA = 0;
let orgB = 0;
let cultoA = 0;
let cultoB = 0;

// Sufixo único (sem Date.now/random em runtime de app, mas em teste é ok) para
// não colidir com dados existentes.
const tag = `iso-test-${process.pid}`;

beforeAll(async () => {
    try {
        const { rows } = await pool.query("SELECT current_setting('is_superuser') AS su");
        if (rows[0].su === 'on') {
            pular = true;
            motivo = 'conexão é superusuário (RLS não é exercitado) — configure APP_DATABASE_URL p/ deepscales_app';
            return;
        }
    } catch (err) {
        pular = true;
        motivo = `banco indisponível (${(err as Error).message})`;
        return;
    }

    // Cria 2 orgs + 1 culto em cada, via bypass (provisionamento de sistema).
    await withBypass(async (client) => {
        const a = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano)
             VALUES ('Org A', $1, $2, 'free') RETURNING id`,
            [`AAA-${tag}`, `org-a-${tag}`],
        )).rows[0];
        const b = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano)
             VALUES ('Org B', $1, $2, 'free') RETURNING id`,
            [`BBB-${tag}`, `org-b-${tag}`],
        )).rows[0];
        orgA = a.id;
        orgB = b.id;

        cultoA = (await client.query(
            `INSERT INTO cultos (data_hora, tipo, org_id) VALUES (NOW(), 'Culto A', $1) RETURNING id`,
            [orgA],
        )).rows[0].id;
        cultoB = (await client.query(
            `INSERT INTO cultos (data_hora, tipo, org_id) VALUES (NOW(), 'Culto B', $1) RETURNING id`,
            [orgB],
        )).rows[0].id;
    });
});

afterAll(async () => {
    if (!pular && orgA && orgB) {
        await withBypass(async (client) => {
            await client.query('DELETE FROM cultos WHERE org_id = ANY($1)', [[orgA, orgB]]);
            await client.query('DELETE FROM membros WHERE org_id = ANY($1)', [[orgA, orgB]]);
            await client.query('DELETE FROM organizacoes WHERE id = ANY($1)', [[orgA, orgB]]);
        });
    }
    await pool.end();
});

describe('isolamento por organização (RLS)', () => {
    it('A só enxerga os próprios cultos (não vê os de B)', async (ctx) => {
        if (pular) return ctx.skip();
        const vistos = await comOrg(orgA, () => query('SELECT id, org_id FROM cultos'));
        expect(vistos.rows.length).toBeGreaterThan(0);
        expect(vistos.rows.every((r) => r.org_id === orgA)).toBe(true);
        expect(vistos.rows.some((r) => r.id === cultoB)).toBe(false);
    });

    it('A não lê um culto de B nem por id direto (404-equivalente: 0 linhas)', async (ctx) => {
        if (pular) return ctx.skip();
        const r = await comOrg(orgA, () => query('SELECT * FROM cultos WHERE id = $1', [cultoB]));
        expect(r.rows.length).toBe(0);
    });

    it('A não consegue ALTERAR um culto de B (0 linhas afetadas)', async (ctx) => {
        if (pular) return ctx.skip();
        const upd = await comOrg(orgA, () =>
            query('UPDATE cultos SET tipo = $1 WHERE id = $2 RETURNING *', ['HACK', cultoB]),
        );
        expect(upd.rows.length).toBe(0);
        // B continua intacto.
        const b = await comOrg(orgB, () => query('SELECT tipo FROM cultos WHERE id = $1', [cultoB]));
        expect(b.rows[0].tipo).toBe('Culto B');
    });

    it('A não consegue APAGAR um culto de B (0 linhas afetadas)', async (ctx) => {
        if (pular) return ctx.skip();
        const del = await comOrg(orgA, () =>
            query('DELETE FROM cultos WHERE id = $1 RETURNING *', [cultoB]),
        );
        expect(del.rows.length).toBe(0);
        const aindaExiste = await comOrg(orgB, () => query('SELECT 1 FROM cultos WHERE id = $1', [cultoB]));
        expect(aindaExiste.rows.length).toBe(1);
    });

    it('INSERT sem org_id herda a org da sessão (DEFAULT) e não vaza p/ B', async (ctx) => {
        if (pular) return ctx.skip();
        const novo = await comOrg(orgA, () =>
            query("INSERT INTO cultos (data_hora, tipo) VALUES (NOW(), 'Nascido em A') RETURNING id, org_id"),
        );
        expect(novo.rows[0].org_id).toBe(orgA);
        const idNovo = novo.rows[0].id;
        const bTentaVer = await comOrg(orgB, () => query('SELECT 1 FROM cultos WHERE id = $1', [idNovo]));
        expect(bTentaVer.rows.length).toBe(0);
    });

    it('WITH CHECK bloqueia forjar org_id de outra org no INSERT', async (ctx) => {
        if (pular) return ctx.skip();
        await expect(
            comOrg(orgA, () =>
                query('INSERT INTO cultos (data_hora, tipo, org_id) VALUES (NOW(), $1, $2)', ['forjado', orgB]),
            ),
        ).rejects.toThrow();
    });
});
