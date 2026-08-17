import { Pool, PoolClient, QueryResult } from 'pg'
import { AsyncLocalStorage } from 'node:async_hooks'
import "dotenv/config"

// Banco local (docker/localhost) não usa SSL; remoto (Neon/produção) exige.
// Assim a mesma connection string serve para dev e produção.
const ehBancoLocal = (url?: string) =>
    !!url && /@(localhost|127\.0\.0\.1)([:/]|$)/.test(url)

// Conexão da APLICAÇÃO: prefere APP_DATABASE_URL (role dedicado `deepscales_app`,
// não-superusuário → sujeito ao RLS). Cai para DATABASE_URL se não configurada
// (dev inicial), mas aí o RLS fica DORMENTE se DATABASE_URL for de superusuário.
const appConnectionString = process.env.APP_DATABASE_URL || process.env.DATABASE_URL

export const pool = appConnectionString
    ? new Pool({
        connectionString: appConnectionString,
        ssl: ehBancoLocal(appConnectionString) ? false : { rejectUnauthorized: false },
    })
    : new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
    })

// Contexto de tenant por request (propagado pela cadeia async do Express via
// AsyncLocalStorage). Setado no authMiddleware — é a injeção CENTRALIZADA de org
// (decisão D-01.1: um único ponto, não `WHERE org_id` espalhado por função).
export const tenantStorage = new AsyncLocalStorage<{ orgId: number }>()

/**
 * Query padrão da aplicação. Se houver contexto de tenant, roda dentro de uma
 * transação que define `app.current_org` (SET LOCAL) — as políticas RLS então
 * filtram por essa org e o DEFAULT de `org_id` preenche INSERTs automaticamente.
 *
 * Sem contexto (rotas pré-auth como login/criar-org): cai para o pool direto.
 * Nessas, as tabelas com RLS ficam fail-closed — use `unscopedQuery` para as
 * operações cross-tenant legítimas.
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
    const ctx = tenantStorage.getStore()
    if (!ctx) {
        return pool.query(text, params)
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        // is_local = true → o GUC vale só nesta transação e é limpo no COMMIT/ROLLBACK,
        // então a conexão volta limpa ao pool (sem vazar org entre requests).
        await client.query("SELECT set_config('app.current_org', $1, true)", [String(ctx.orgId)])
        const result = await client.query(text, params)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

/**
 * Query de SISTEMA que IGNORA o RLS (bypass). Uso restrito a operações
 * legitimamente cross-tenant que rodam antes de existir uma org autenticada:
 * login por email (email é único global), buscar org por código, checar unicidade
 * de código. Nunca deve receber `app.current_org` de input do usuário.
 */
export async function unscopedQuery(text: string, params?: any[]): Promise<QueryResult> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query("SET LOCAL app.bypass_rls = 'on'")
        const result = await client.query(text, params)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

/**
 * Executa uma função com um client transacional em modo bypass (RLS desligado).
 * Para fluxos multi-statement de sistema — ex.: criar organização + admin, onde
 * ainda não existe uma org na sessão.
 */
export async function withBypass<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query("SET LOCAL app.bypass_rls = 'on'")
        const result = await fn(client)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}
