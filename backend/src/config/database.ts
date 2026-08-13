import { Pool } from 'pg'
import "dotenv/config"

// Banco local (docker/localhost) não usa SSL; remoto (Neon/produção) exige.
// Assim o mesmo DATABASE_URL serve para dev e produção.
const ehBancoLocal = (url?: string) =>
    !!url && /@(localhost|127\.0\.0\.1)([:/]|$)/.test(url)

export const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: ehBancoLocal(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    })
    : new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
    })

export const query = (text: string, params?: any[]) => pool.query(text, params)