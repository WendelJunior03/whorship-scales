import { query } from '../config/database';

export async function createMembers(
    name: string,
    phone: string,
    instrument: string,
    email: string,
    role: string,
    password: string) {

    const result = await query('INSERT INTO membros (nome, telefone, instrumento, email, papel, senha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, phone, instrument, email, role, password]);

    return result.rows[0];

}

export async function findByEmail(email: string) {
    const membro = await query('SELECT * FROM membros WHERE email = $1', [email])

    return membro.rows[0];
}